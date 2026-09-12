import { describe, expect, it } from "vitest";
import { bindTwig, type BindTrack, type BindUnderstanding } from "./bind";

const track = (over: Partial<BindTrack> & { slug: string }): BindTrack => ({
  family: "support",
  topic: "audio_topic_anxiety",
  tags: [],
  active: true,
  ...over,
});

const u = (over: Partial<BindUnderstanding> = {}): BindUnderstanding => ({
  primaryEmotion: "anxiety",
  thematicTags: [],
  suggestedSpecialty: undefined,
  ...over,
});

const bind = (actionType: string, tracks: BindTrack[], over?: Partial<BindUnderstanding>) =>
  bindTwig(actionType, u(over), tracks);

describe("bindTwig", () => {
  it("breathing and xolacer bind without content", () => {
    expect(bind("breathing", [])).toEqual({ exercise: "sit-with-this" });
    expect(bind("xolacer", [])).toBeNull();
    expect(bind("xolacer", [], { suggestedSpecialty: "burnout" })).toEqual({ specialty: "burnout" });
  });

  it("binds audio_topic_* to the best tag match in its own family and topic", () => {
    const tracks = [
      track({ slug: "b", tags: ["anxiety", "racing-thoughts"] }),
      track({ slug: "a", tags: ["anxiety"] }),
      track({ slug: "music", family: "music", tags: ["anxiety", "racing-thoughts"] }),
      track({ slug: "grief", topic: "audio_topic_grief", tags: ["anxiety", "racing-thoughts"] }),
    ];
    expect(bind("audio_topic_anxiety", tracks, { thematicTags: ["racing-thoughts"] })).toEqual({ slug: "b" });
  });

  it("breaks ties on slug, independent of input order", () => {
    const a = track({ slug: "a", tags: ["anxiety"] });
    const b = track({ slug: "b", tags: ["anxiety"] });
    expect(bind("audio_topic_anxiety", [b, a])).toEqual({ slug: "a" });
    expect(bind("audio_topic_anxiety", [a, b])).toEqual({ slug: "a" });
  });

  it("music_topic_* binds only against the music family", () => {
    const tracks = [
      track({ slug: "spoken", topic: "music_topic_sadness" }),
      track({ slug: "tune", family: "music", topic: "music_topic_sadness" }),
    ];
    expect(bind("music_topic_sadness", tracks)).toEqual({ slug: "tune" });
    expect(bind("music_topic_sadness", [tracks[0]])).toBeNull();
  });

  it("episode_reframe binds only to reframe-series rows, across topics", () => {
    const tracks = [
      track({ slug: "spectrum", series: "the-spectrum" }),
      track({ slug: "plain" }),
      track({ slug: "reframe", topic: "audio_topic_shame", series: "reality-not-false-hope" }),
    ];
    expect(bind("episode_reframe", tracks)).toEqual({ slug: "reframe" });
    expect(bind("episode_reframe", tracks.slice(0, 2))).toBeNull();
  });

  it("tier never gates: episodes of any tier and standalones compete on tags only", () => {
    const t4 = track({ slug: "t4", series: "the-spectrum", tags: ["anxiety", "racing-thoughts"] });
    const standalone = track({ slug: "standalone", tags: ["anxiety"] });
    expect(bind("audio_topic_anxiety", [standalone, t4], { thematicTags: ["racing-thoughts"] })).toEqual({ slug: "t4" });
    const t4Tied = track({ slug: "t4", series: "the-spectrum", tags: ["anxiety"] });
    expect(bind("audio_topic_anxiety", [t4Tied, standalone])).toEqual({ slug: "standalone" });
  });

  it("skips inactive rows and unknown action types", () => {
    expect(bind("audio_topic_anxiety", [track({ slug: "off", active: false })])).toBeNull();
    expect(bind("not_a_key", [track({ slug: "x" })])).toBeNull();
  });
});
