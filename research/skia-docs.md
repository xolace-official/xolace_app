# SKIA DOCS

---
id: hello-world
title: Hello World
sidebar_label: Hello World
slug: /getting-started/hello-world
---

React Native Skia provides a declarative API using its own React Renderer.

```tsx twoslash
import React from "react";
import { Canvas, Circle, Group } from "@shopify/react-native-skia";

const App = () => {
  const width = 256;
  const height = 256;
  const r = width * 0.33;
  return (
    <Canvas style={{ width, height }}>
      <Group blendMode="multiply">
        <Circle cx={r} cy={r} r={r} color="cyan" />
        <Circle cx={width - r} cy={r} r={r} color="magenta" />
        <Circle cx={width / 2} cy={width - r} r={r} color="yellow" />
      </Group>
    </Canvas>
  );
};

export default App;
```

### Result

<img src={require("/static/img/getting-started/hello-world/blend-modes.png").default} width="256" height="256" alt="Hello World" />


---
id: canvas
title: Canvas
sidebar_label: Overview
slug: /canvas/overview
---

The Canvas component is the root of your Skia drawing.
You can treat it as a regular React Native view and assign a view style.
Behind the scenes, it is using its own React renderer.

| Name | Type     |  Description    |
|:-----|:---------|:-----------------|
| style?   | `ViewStyle` | View style |
| ref?   | `Ref<SkiaView>` | Reference to the `SkiaView` object |
| onSize? | `SharedValue<Size>` | Reanimated value to which the canvas size will be assigned  (see [canvas size](#canvas-size)) |
| androidWarmup? | `boolean` | Draw the first frame directly on the Android compositor. Use it for static icons or fully opaque drawings—animated or translucent canvases can misrender, so it remains opt-in. |

## Canvas size

The size of the canvas is available on both the UI and JS thread.

### UI thread

The `onSize` property receives a shared value, which will be updated whenever the canvas size changes.
You can see it in action in the example below.

```tsx twoslash
import {useSharedValue, useDerivedValue} from "react-native-reanimated";
import {Fill, Canvas, Rect} from "@shopify/react-native-skia";

const Demo = () => {
  // size will be updated as the canvas size changes
  const size = useSharedValue({ width: 0, height: 0 });
  const rect = useDerivedValue(() => {
    const {width, height} = size.value;
    return { x: 0, y: 0, width, height };
  });
  return (
    <Canvas style={{ flex: 1 }} onSize={size}>
      <Rect color="cyan" rect={rect} />
    </Canvas>
  );
};
```

### JS thread

To get the canvas size on the JS thread, you can use `useLayoutEffect` and `measure()`.
Since this is a very common pattern, we offer a `useCanvasSize` hook you can use for convenience.

```tsx twoslash
import {Fill, Canvas, Rect, useCanvasSize} from "@shopify/react-native-skia";

const Demo = () => {
  const {ref, size: {width, height}} = useCanvasSize();
  return (
    <Canvas style={{ flex: 1 }} ref={ref}>
      <Rect color="cyan" rect={{ x: 0, y: 0, width, height }} />
    </Canvas>
  );
};
```

This example is equivalent to the code below:

```tsx twoslash
import {useLayoutEffect, useState} from "react";
import {Fill, Canvas, Rect, useCanvasRef} from "@shopify/react-native-skia";

const Demo = () => {
  const ref = useCanvasRef();
  const [rect, setRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
  useLayoutEffect(() => {
    ref.current?.measure((_x, _y, width, height) => {
      setRect({ x: 0, y: 0, width, height });
    });
  }, []);
  return (
    <Canvas style={{ flex: 1 }} ref={ref}>
      <Rect color="cyan" rect={rect} />
    </Canvas>
  );
};
```


## Getting a Canvas Snapshot

You can save your drawings as an image by using the `makeImageSnapshotAsync` method. This method returns a promise that resolves to an [Image](/docs/images).
It executes on the UI thread, ensuring access to the same Skia context as your on-screen canvases, including [textures](https://shopify.github.io/react-native-skia/docs/animations/textures).

If your drawing does not contain textures, you may also use the synchronous `makeImageSnapshot` method for simplicity.

### Example

```tsx twoslash
import {useEffect} from "react";
import {Canvas, useCanvasRef, Circle} from "@shopify/react-native-skia";

export const Demo = () => {
  const ref = useCanvasRef();
  useEffect(() => {
    setTimeout(() => {
      // you can pass an optional rectangle
      // to only save part of the image
      const image = ref.current?.makeImageSnapshot();
      if (image) {
        // you can use image in an <Image> component
        // Or save to file using encodeToBytes -> Uint8Array
        const bytes = image.encodeToBytes();
        console.log({ bytes });
      }
    }, 1000)
  });
  return (
    <Canvas style={{ flex: 1 }} ref={ref}>
      <Circle r={128} cx={128} cy={128} color="red" />
    </Canvas>
  );
};
```

## Accessibility

The Canvas component supports the same properties as a View component including its [accessibility properties](https://reactnative.dev/docs/accessibility#accessible).
You can make elements inside the canvas accessible as well by overlaying views on top of your canvas.
This is the same recipe used for [applying gestures on specific canvas elements](https://shopify.github.io/react-native-skia/docs/animations/gestures/#element-tracking).



---
id: rendering-modes
title: Rendering Modes
sidebar_label: Rendering Modes
slug: /canvas/rendering-modes
---

React Native Skia supports two rendering paradigms: **Retained Mode** and **Immediate Mode**. Understanding when to use each is key to building performant graphics applications.
The Retained Mode allows for extremely fast animation time with a virtually zero FFI-cost if the drawing list is updated at low frequency. The immediate mode allows for dynamic drawing list but has a higher FFI-cost to pay.
Since immediate mode uses the same `<Canvas>` element, you can seamlessly combine both rendering modes in a single scene.


## Retained Mode (Default)

In retained mode, you declare your scene as a tree of React components. React Native Skia converts this tree into a display list that is extremely efficient to animate with Reanimated.
This approach is extremely fast and is best suited for user-interfaces and interactive graphics where the structure doesn't change at animation time.

```tsx twoslash
import React, {useEffect} from "react";
import { Canvas, Circle, Group } from "@shopify/react-native-skia";
import { useSharedValue, withSpring, useDerivedValue } from "react-native-reanimated";

export const RetainedModeExample = () => {
  const radius = useSharedValue(50);
  useEffect(() => {
    radius.value = withSpring(radius.value === 50 ? 100 : 50);
  }, []);
  return (
    <Canvas style={{ flex: 1 }}>
      <Group>
        <Circle cx={128} cy={128} r={radius} color="cyan" />
      </Group>
    </Canvas>
  );
};
```

## Immediate Mode

In immediate mode, you issue drawing commands directly to a canvas on every frame. This gives you complete control over what gets drawn and when, but requires you to manage the drawing logic yourself.

React Native Skia provides immediate mode through the [Picture API](/docs/shapes/pictures).
This mode is extremely well-suited for scenes where the number of drawing commands changes on every animation frame. This is often the case for games, generative art, and particle systems where the scene changes unpredictably on each animation frame.

```tsx twoslash
import { Canvas, Picture, Skia } from "@shopify/react-native-skia";
import { useDerivedValue, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { useEffect } from "react";

const size = 256;

export const ImmediateModeExample = () => {
  const progress = useSharedValue(0);
  const recorder = Skia.PictureRecorder();
  const paint = Skia.Paint();

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 2000 }), -1, true);
  }, [progress]);

  const picture = useDerivedValue(() => {
    "worklet";
    const canvas = recorder.beginRecording(Skia.XYWHRect(0, 0, size, size));

    // Variable number of circles based on progress
    const count = Math.floor(progress.value * 20);
    for (let i = 0; i < count; i++) {
      const r = (i + 1) * 6;
      paint.setColor(Skia.Color(`rgba(0, 122, 255, ${(i + 1) / 20})`));
      canvas.drawCircle(size / 2, size / 2, r, paint);
    }

    return recorder.finishRecordingAsPicture();
  });

  return (
    <Canvas style={{ flex: 1 }}>
      <Picture picture={picture} />
    </Canvas>
  );
};
```

## Choosing the Right Mode

Here is a small list of use-cases and which mode would be best for that scenario. Keep in mind that since these modes use the same `<Canvas>` element they can be nicely composed with each other. For instance a game where the scene is dynamic on every animation frame and some game UI elements are built in Retained Mode.

| Scenario | Recommended Mode | Why |
|:---------|:-----------------|:----|
| UI with animated properties | Retained | Zero FFI cost during animation |
| Data visualization | Retained | Structure usually fixed |
| Fixed number of sprites/tiles | Retained | With the [Atlas API](/docs/shapes/atlas), single draw call |
| Game with dynamic entities | Immediate | Entities created/destroyed |
| Procedural/generative art | Immediate | Dynamic drawing commands |


---
id: contexts
title: Contexts
sidebar_label: Contexts
slug: /canvas/contexts
---

React Native Skia is using its own React renderer.
It is currently impossible to automatically share a React context between two renderers.
This means that a React Native context won't be available from your drawing directly.
We recommend preparing the data needed for your drawing outside the `<Canvas>` element.
However, if you need to use a React context within your drawing, you must re-inject it.

We found [its-fine](https://github.com/pmndrs/its-fine), also used by [react-three-fiber](https://github.com/pmndrs/react-three-fiber), to provide an elegant solution to this problem.

## Using `its-fine`

```tsx twoslash
import React from "react";
import { Canvas, Fill } from "@shopify/react-native-skia";
import {useTheme, ThemeProvider, ThemeContext} from "./docs/getting-started/Theme";
import { useContextBridge, FiberProvider } from "its-fine";

const MyDrawing = () => {
  const { primary } = useTheme();
  return <Fill color={primary} />;
};

export const Layer = () => {
  const ContextBridge = useContextBridge();
  return (
    <Canvas style={{ flex: 1 }}>
      <ContextBridge>
        <Fill color="black" />
        <MyDrawing />
      </ContextBridge>
    </Canvas>
  );
};

export const App = () => {
  return (
    <FiberProvider>
      <ThemeProvider primary="red">
        <Layer />
      </ThemeProvider>
    </FiberProvider>
  );
};
```

Below is the context definition that was used in this example:

```tsx twoslash
import type { ReactNode } from "react";
import React, { useContext, createContext } from "react";

interface Theme {
  primary: string;
}

export const ThemeContext = createContext<Theme | null>(null);

export const ThemeProvider = ({
  primary,
  children,
}: {
  primary: string;
  children: ReactNode;
}) => (
  <ThemeContext.Provider value={{ primary }}>
    {children}
  </ThemeContext.Provider>
);

export const useTheme = () => {
  const theme = useContext(ThemeContext);
  if (theme === null) {
    throw new Error("Theme provider not found");
  }
  return theme;
};
```

---
id: path
title: Path
sidebar_label: Path
slug: /shapes/path
---

In Skia, paths are semantically identical to [SVG Paths](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths).

| Name      | Type      |  Description                                                  |
|:----------|:----------|:--------------------------------------------------------------|
| path      | `SkPath` or `string` | Path to draw. Can be a string using the [SVG Path notation](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths#line_commands) or an object created with `Skia.PathBuilder`. |
| start     | `number` | Trims the start of the path. Value is in the range `[0, 1]` (default is 0). |
| end       | `number` | Trims the end of the path. Value is in the range `[0, 1]` (default is 1). |
| stroke    | `StrokeOptions` | Turns this path into the filled equivalent of the stroked path. This will fail if the path is a hairline. `StrokeOptions` describes how the stroked path should look. It contains three properties: `width`, `strokeMiterLimit` and, `precision` |

React Native Skia also provides [Path Effects](/docs/path-effects) and [Path hooks](/docs/animations/hooks) for animations.

### Using SVG Notation

```tsx twoslash
import {Canvas, Path} from "@shopify/react-native-skia";

const SVGNotation = () => {
  return (
    <Canvas style={{ flex: 1 }}>
      <Path
        path="M 128 0 L 168 80 L 256 93 L 192 155 L 207 244 L 128 202 L 49 244 L 64 155 L 0 93 L 88 80 L 128 0 Z"
        color="lightblue"
      />
    </Canvas>
  );
};
```

![SVG Notation](assets/path/svg.png)

### Using Path Object

```tsx twoslash
import {Canvas, Path, Skia} from "@shopify/react-native-skia";

const path = Skia.PathBuilder.Make()
  .moveTo(128, 0)
  .lineTo(168, 80)
  .lineTo(256, 93)
  .lineTo(192, 155)
  .lineTo(207, 244)
  .lineTo(128, 202)
  .lineTo(49, 244)
  .lineTo(64, 155)
  .lineTo(0, 93)
  .lineTo(88, 80)
  .lineTo(128, 0)
  .close()
  .build();

const PathDemo = () => {
  return (
    <Canvas style={{ flex: 1 }}>
      <Path
        path={path}
        color="lightblue"
      />
    </Canvas>
  );
};
```

![Path Object](assets/path/path-object.png)

### Trim

```tsx twoslash
import {Canvas, Path} from "@shopify/react-native-skia";

const SVGNotation = () => {
  return (
    <Canvas style={{ flex: 1 }}>
      <Path
        path="M 128 0 L 168 80 L 256 93 L 192 155 L 207 244 L 128 202 L 49 244 L 64 155 L 0 93 L 88 80 L 128 0 Z"
        color="lightblue"
        style="stroke"
        strokeJoin="round"
        strokeWidth={5}
        // We trim the first and last quarter of the path
        start={0.25}
        end={0.75}
      />
    </Canvas>
  );
};
```

![Trim](assets/path/trim.png)


## Fill Type

The `fillType` property defines the algorithm to use to determine the inside part of a shape.
Possible values are: `winding`, `evenOdd`, `inverseWinding`, `inverseEvenOdd`. Default value is `winding`.

```tsx twoslash
import {Canvas, Skia, Fill, Path} from "@shopify/react-native-skia";

const star = () => {
  const R = 115.2;
  const C = 128.0;
  const builder = Skia.PathBuilder.Make();
  builder.moveTo(C + R, C);
  for (let i = 1; i < 8; ++i) {
    const a = 2.6927937 * i;
    builder.lineTo(C + R * Math.cos(a), C + R * Math.sin(a));
  }
  return builder.build();
};

export const HelloWorld = () => {
  const path = star();
  return (
    <Canvas style={{ flex: 1 }}>
      <Fill color="white" />
      <Path path={path} style="stroke" strokeWidth={4} color="#3EB489"/>
      <Path path={path} color="lightblue" fillType="evenOdd" />
    </Canvas>
  );
};
```

<img src={require("/static/img/paths/evenodd-filltype.png").default} width="256" height="256" />


---
id: polygons
title: Polygons
sidebar_label: Polygons
slug: /shapes/polygons
---

## Rect

Draws a rectangle.

| Name   | Type     | Description              |
| :----- | :------- | :----------------------- |
| x      | `number` | X coordinate.            |
| y      | `number` | Y coordinate.            |
| width  | `number` | Width of the rectangle.  |
| height | `number` | Height of the rectangle. |

```tsx twoslash
import { Canvas, Rect } from "@shopify/react-native-skia";

const RectDemo = () => {
  return (
    <Canvas style={{ flex: 1 }}>
      <Rect x={0} y={0} width={256} height={256} color="lightblue" />
    </Canvas>
  );
};
```

## RoundedRect

Draws a rounded rectangle.

| Name   | Type     | Description                                                   |
| :----- | :------- | :------------------------------------------------------------ |
| x      | `number` | X coordinate.                                                 |
| y      | `number` | Y coordinate.                                                 |
| width  | `number` | Width of the rectangle.                                       |
| height | `number` | Height of the rectangle.                                      |
| r?    | `number` or `Vector` | Corner radius. Defaults to `ry` if specified or 0. |

```tsx twoslash
import { Canvas, RoundedRect } from "@shopify/react-native-skia";

const RectDemo = () => {
  return (
    <Canvas style={{ flex: 1 }}>
      <RoundedRect
        x={0}
        y={0}
        width={256}
        height={256}
        r={25}
        color="lightblue"
      />
    </Canvas>
  );
};
```

<img src={require("/static/img/rrect/uniform.png").default} width="256" height="256" />

### Using Custom Radii

You can set a different corner radius for each corner.

```tsx twoslash
import { Canvas, RoundedRect } from "@shopify/react-native-skia";

const RectDemo = () => {
  const size = 256;
  const r = size * 0.2;
  const rrct = {
    rect: { x: 0, y: 0, width: size, height: size },
    topLeft: { x: 0, y: 0 },
    topRight: { x: r, y: r },
    bottomRight: { x: 0, y: 0 },
    bottomLeft: { x: r, y: r },
  };
  return (
    <Canvas style={{ width: size, height: size }}>
      <RoundedRect
        rect={rrct}
        color="lightblue"
      />
    </Canvas>
  );
};
```

<img src={require("/static/img/rrect/nonuniform.png").default} width="256" height="256" />

## DiffRect

Draws the difference between two rectangles.

| Name  | Type          | Description      |
| :---- | :------------ | :--------------- |
| outer | `RectOrRRect` | Outer rectangle. |
| inner | `RectOrRRect` | Inner rectangle. |

```tsx twoslash
import { Canvas, DiffRect, rect, rrect } from "@shopify/react-native-skia";

const DRectDemo = () => {
  const outer = rrect(rect(0, 0, 256, 256), 25, 25);
  const inner = rrect(rect(50, 50, 256 - 100, 256 - 100), 50, 50);
  return (
    <Canvas style={{ flex: 1 }}>
      <DiffRect inner={inner} outer={outer} color="lightblue" />
    </Canvas>
  );
};
```

<img src={require("/static/img/shapes/drect.png").default} width="256" height="256" />

## Line

Draws a line between two points.

| Name | Type    | Description  |
| :--- | :------ | :----------- |
| p1   | `Point` | Start point. |
| p2   | `Point` | End point.   |

```tsx twoslash
import { Canvas, Line, vec } from "@shopify/react-native-skia";

const LineDemo = () => {
  return (
    <Canvas style={{ flex: 1 }}>
      <Line
        p1={vec(0, 0)}
        p2={vec(256, 256)}
        color="lightblue"
        style="stroke"
        strokeWidth={4}
      />
    </Canvas>
  );
};
```

![Line](assets/polygons/line.png)

## Points

Draws points and optionally draws the connection between them.

| Name   | Type        | Description                                                                                                                                                |
| :----- | :---------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------- |
| points | `Point`     | Points to draw.                                                                                                                                            |
| mode   | `PointMode` | How should the points be connected. Can be `points` (no connection), `lines` (connect pairs of points), or `polygon` (connect lines). Default is `points`. |

```tsx twoslash
import { Canvas, Points, vec } from "@shopify/react-native-skia";

const PointsDemo = () => {
  const points = [
    vec(128, 0),
    vec(168, 80),
    vec(256, 93),
    vec(192, 155),
    vec(207, 244),
    vec(128, 202),
    vec(49, 244),
    vec(64, 155),
    vec(0, 93),
    vec(88, 80),
    vec(128, 0),
  ];
  return (
    <Canvas style={{ flex: 1 }}>
      <Points
        points={points}
        mode="polygon"
        color="lightblue"
        style="stroke"
        strokeWidth={4}
      />
    </Canvas>
  );
};
```

![Point](assets/polygons/points.png)

---
id: vertices
title: Vertices
sidebar_label: Vertices
slug: /shapes/vertices
---

Draws vertices.

| Name       | Type         | Description              |
| :--------- | :----------- | :----------------------- |
| vertices   | `Point[]`    | Vertices to draw |
| mode?      | `VertexMode` | Can be `triangles`, `triangleStrip` or `triangleFan`. Default is `triangles` |
| indices?   | `number[]`   | Indices of the vertices that form the triangles. If not provided, the order of the vertices will be taken. Using this property enables you not to duplicate vertices. |
| textures   | `Point[]`   | [Texture mapping](https://en.wikipedia.org/wiki/Texture_mapping). The texture is the shader provided by the paint. |
| colors?    | `string[]`   | Optional colors to be associated to each vertex |
| blendMode? | `BlendMode`  | If `colors` is provided, colors are blended with the paint using the blend mode. Default is `dstOver` if colors are provided, `srcOver` if not. |

## Using texture mapping

```tsx twoslash
import { Canvas, Group, ImageShader, Vertices, vec, useImage } from "@shopify/react-native-skia";

const VerticesDemo = () => {
  const image = useImage(require("./assets/squares.png"));
  const vertices = [vec(64, 0), vec(128, 256), vec(0, 256)];
  const colors = ["#61dafb", "#fb61da", "#dafb61"];
  const textures = [vec(0, 0), vec(0, 128), vec(64, 256)];
  if (!image) {
    return null;
  }
  return (
    <Canvas style={{ flex: 1 }}>
      {/* This is our texture */}
      <Group>
        <ImageShader
          image={image}
          tx="repeat"
          ty="repeat"
        />
        {/* Here we specified colors, the default blendMode is dstOver */}
        <Vertices vertices={vertices} colors={colors} />
        <Group transform={[{ translateX: 128 }]}>
          {/* Here we didn't specify colors, the default blendMode is srcOver */}
          <Vertices vertices={vertices} textures={textures} />
        </Group>
      </Group>
    </Canvas>
  );
};
```

![Texture Mapping](assets/vertices/textureMapping.png)

## Using indices

In the example below, we defined four vertices, representing four corners of a rectangle.
Then we use the indices property to define the two triangles we would like to draw based on these four vertices.
* First triangle: `0, 1, 2` (top-left, top-right, bottom-right).
* Second triangle: `0, 2, 3` (top-left, bottom-right, bottom-left).

```tsx twoslash
import { Canvas, Vertices, vec } from "@shopify/react-native-skia";

const IndicesDemo = () => {
  const vertices = [vec(0, 0), vec(256, 0), vec(256, 256), vec(0, 256)];
  const colors = ["#61DAFB", "#fb61da", "#dafb61", "#61fbcf"];
  const triangle1 = [0, 1, 2];
  const triangle2 = [0, 2, 3];
  const indices = [...triangle1, ...triangle2];
  return (
    <Canvas style={{ flex: 1 }}>
      <Vertices vertices={vertices} colors={colors} indices={indices} />
    </Canvas>
  );
};
```

![Indices](assets/vertices/indices.png)


---
id: animations
title: Animations
sidebar_label: Animations
slug: /animations/animations
---

React Native Skia offers integration with [Reanimated v3 and above](https://docs.swmansion.com/react-native-reanimated/), enabling the execution of animations on the UI thread.

React Native Skia supports the direct usage of Reanimated's shared and derived values as properties. There is no need for functions like `createAnimatedComponent` or `useAnimatedProps`; simply pass the Reanimated values directly as properties.

```tsx twoslash
import {useEffect} from "react";
import {Canvas, Circle, Group} from "@shopify/react-native-skia";
import {
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

export const HelloWorld = () => {
  const size = 256;
  const r = useSharedValue(0);
  const c = useDerivedValue(() => size - r.value);
  useEffect(() => {
    r.value = withRepeat(withTiming(size * 0.33, { duration: 1000 }), -1);
  }, [r, size]);
  return (
    <Canvas style={{ flex: 1 }}>
      <Group blendMode="multiply">
        <Circle cx={r} cy={r} r={r} color="cyan" />
        <Circle cx={c} cy={r} r={r} color="magenta" />
        <Circle
          cx={size/2}
          cy={c}
          r={r}
          color="yellow"
        />
      </Group>
    </Canvas>
  );
};
```

We offer some [Skia specific animation hooks](/docs/animations/hooks), especially for paths.

## Colors

For colors, React Native Skia uses a different storage format from Reanimated.
This means that [`interpolateColor`](https://docs.swmansion.com/react-native-reanimated/docs/utilities/interpolateColor/) from Reanimated won't work out of the box.
Instead you can use `interpolateColors` from React Native Skia.

```tsx twoslash
import {
  Canvas,
  LinearGradient,
  Fill,
  // Use this function instead of interpolateColor from Reanimated
  interpolateColors,
  vec,
} from "@shopify/react-native-skia";
import { useEffect } from "react";
import { useWindowDimensions } from "react-native";
import {
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const startColors = [
  "rgba(34, 193, 195, 0.4)",
  "rgba(34,193,195,0.4)",
  "rgba(63,94,251,1)",
  "rgba(253,29,29,0.4)",
];
const endColors = [
  "rgba(0,212,255,0.4)",
  "rgba(253,187,45,0.4)",
  "rgba(252,70,107,1)",
  "rgba(252,176,69,0.4)",
];

export const AnimatedGradient = () => {
  const { width, height } = useWindowDimensions();
  const colorsIndex = useSharedValue(0);
  useEffect(() => {
    colorsIndex.value = withRepeat(
      withTiming(startColors.length - 1, {
        duration: 4000,
      }),
      -1,
      true
    );
  }, []);
  const gradientColors = useDerivedValue(() => {
    return [
      interpolateColors(colorsIndex.value, [0, 1, 2, 3], startColors),
      interpolateColors(colorsIndex.value, [0, 1, 2, 3], endColors),
    ];
  });
  return (
    <Canvas style={{ flex: 1 }}>
      <Fill>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(width, height)}
          colors={gradientColors}
        />
      </Fill>
    </Canvas>
  );
};
```


---
id: hooks
title: Hooks
sidebar_label: Hooks
slug: /animations/hooks
---

Below are animations hooks we provide when using React Native Skia with Reanimated.
We also provide hooks for [creating textures](/docs/animations/textures) when integrating with Reanimated.

## usePathInterpolation

This hook interpolates between different path values based on a progress value, providing smooth transitions between the provided paths.

Paths need to be interpolatable, meaning they must contain the same number and types of commands. If the paths have different commands or different numbers of commands, the interpolation may not behave as expected. Ensure that all paths in the `outputRange` array are structured similarly for proper interpolation.
To interpolate two completely different paths, we found the [flubber library](https://github.com/veltman/flubber) to work well with Skia ([see example](https://github.com/wcandillon/can-it-be-done-in-react-native/blob/master/season5/src/Headspace/Play.tsx#L16)).

```tsx twoslash
import React, { useEffect } from 'react';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { Skia, usePathInterpolation, Canvas, Path } from '@shopify/react-native-skia';

const angryPath = Skia.Path.MakeFromSVGString("M 16 25 C 32 27 43 28 49 28 C 54 28 62 28 73 26 C 66 54 60 70 55 74 C 51 77 40 75 27 55 C 25 50 21 40 27 55 Z")!;
const normalPath = Skia.Path.MakeFromSVGString("M 21 31 C 31 32 39 32 43 33 C 67 35 80 36 81 38 C 84 42 74 57 66 60 C 62 61 46 59 32 50 C 24 44 20 37 21 31 Z")!;
const goodPath = Skia.Path.MakeFromSVGString("M 21 45 C 21 37 24 29 29 25 C 34 20 38 18 45 18 C 58 18 69 30 69 45 C 69 60 58 72 45 72 C 32 72 21 60 21 45 Z")!;

const Demo = () => {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(1, { duration: 1000 });
  }, []);

  const path = usePathInterpolation(progress, [0, 0.5, 1], [angryPath, normalPath, goodPath]);
  return (
    <Canvas style={{ flex: 1 }}>
      <Path path={path} style="stroke" strokeWidth={5} strokeCap="round" strokeJoin="round" />
    </Canvas>
  );
};
```

## usePathValue

This hooks offers an easy way to animate paths.
Behind the scene, it make sure that everything is done as efficiently as possible.
There is an optional second parameter available to set the default path value.

```tsx twoslash
import {useSharedValue, withSpring} from "react-native-reanimated";
import {Gesture, GestureDetector} from "react-native-gesture-handler";
import {usePathValue, Canvas, Path, processTransform3d, Skia} from "@shopify/react-native-skia";

const rrct = Skia.PathBuilder.Make()
  .addRRect(Skia.RRectXY(Skia.XYWHRect(0, 0, 100, 100), 10, 10))
  .build();

export const FrostedCard = () => {
  const rotateY = useSharedValue(0);

  const gesture = Gesture.Pan().onChange((event) => {
    rotateY.value -= event.changeX / 300;
  });

  const clip = usePathValue(
    () => {
      "worklet";
    },
    rrct,
    (path) => {
      "worklet";
      return path.transform(
        processTransform3d([
          { translate: [50, 50] },
          { perspective: 300 },
          { rotateY: rotateY.value },
          { translate: [-50, -50] },
        ])
      );
    }
  );
  return (
    <GestureDetector gesture={gesture}>
      <Canvas style={{ flex: 1 }}>
        <Path path={clip} />
      </Canvas>
    </GestureDetector>
  );
};
```

## useClock

This hook returns a number indicating the time in milliseconds since the hook was activated.

```tsx twoslash
import { Canvas, useClock, vec, Circle } from "@shopify/react-native-skia";
import { useDerivedValue } from "react-native-reanimated";

export default function App() {
  const t = useClock();

  const transform = useDerivedValue(() => {
    const scale = (2 / (3 - Math.cos(2 * t.value))) * 200;
    return [
      { translateX: scale * Math.cos(t.value) },
      { translateY: scale * (Math.sin(2 * t.value) / 2) },
    ];
  });

  return (
    <Canvas style={{ flex: 1 }}>
      <Circle c={vec(0, 0)} r={50} color="cyan" transform={transform} />
    </Canvas>
  );
}
```

## useRectBuffer

Creates an array for rectangle to be animated.
Can be used by any component that takes an array of rectangles as property, like the [Atlas API](/docs/shapes/atlas).

```tsx twoslash
import {useRectBuffer} from "@shopify/react-native-skia";

const width = 256;
const size = 10;
const rects = 100;
// Important to not forget the worklet directive
const rectBuffer = useRectBuffer(rects, (rect, i) => {
  "worklet";
  rect.setXYWH((i * size) % width, Math.floor(i / (width / size)) * size, size, size);
}); 
```

## useRSXformBuffer

Creates an array for [rotate scale transforms](/docs/shapes/atlas#rsxform) to be animated.
Can be used by any component that takes an array of rotate scale transforms as property, like the [Atlas API](/docs/shapes/atlas).

```tsx twoslash
import {useRSXformBuffer} from "@shopify/react-native-skia";
import {useSharedValue} from "react-native-reanimated";

const xforms = 100;
const pos = useSharedValue({ x: 0, y: 0 });
// Important to not forget the worklet directive
const transforms = useRSXformBuffer(xforms, (val, _i) => {
  "worklet";
  const r = Math.atan2(pos.value.y, pos.value.x);
  val.set(Math.cos(r), Math.sin(r), 0, 0);
});
```

---
id: patch
title: Patch
sidebar_label: Patch
slug: /shapes/patch
---

Draws a [Coons patch](https://en.wikipedia.org/wiki/Coons_patch).

| Name      | Type      |  Description                                                  |
|:----------|:----------|:--------------------------------------------------------------|
| cubics | `CubicBezier[4]` | Specifies four cubic Bezier starting at the top-left corner, in clockwise order, sharing every fourth point. The last cubic Bezier ends at the first point. |
| textures   | `Point[]`   | [Texture mapping](https://en.wikipedia.org/wiki/Texture_mapping). The texture is the shader provided by the paint |
| colors?    | `string[]`   | Optional colors to be associated to each corner |
| blendMode? | `BlendMode`  | If `colors` is provided, colors are blended with the paint using the blend mode. Default is `dstOver` if colors are provided, `srcOver` if not |

## Example

```tsx twoslash
import {Canvas, Patch, vec} from "@shopify/react-native-skia";

const PatchDemo = () => {
  const colors = ["#61dafb", "#fb61da", "#61fbcf", "#dafb61"];
  const C = 64;
  const width = 256;
  const topLeft = { pos: vec(0, 0), c1: vec(0, C), c2: vec(C, 0) };
  const topRight = {
    pos: vec(width, 0),
    c1: vec(width, C),
    c2: vec(width + C, 0),
  };
  const bottomRight = {
    pos: vec(width, width),
    c1: vec(width, width - 2 * C),
    c2: vec(width - 2 * C, width),
  };
  const bottomLeft = {
    pos: vec(0, width),
    c1: vec(0, width - 2 * C),
    c2: vec(-2 * C, width),
  };
  return (
    <Canvas style={{ flex: 1 }}>
      <Patch
        colors={colors}
        patch={[topLeft, topRight, bottomRight, bottomLeft]}
      />
    </Canvas>
  );
};
```

![SVG Notation](assets/patch/example1.png)




---
id: path-migration
title: Path API Migration Guide
sidebar_label: Migration Guide
slug: /shapes/path-migration
---

This guide helps you migrate from the mutable Path API to the new immutable Path API with `PathBuilder`.

## Why the Change?

The new API aligns with Skia's native direction toward immutable paths:
- **Immutable `SkPath`**: Paths are now immutable with query methods only
- **Mutable `SkPathBuilder`**: Use `PathBuilder` for path construction, then call `.build()` to get an immutable path
- **Static factories**: Common shapes can be created directly via `Skia.Path.Circle()`, `Skia.Path.Rect()`, etc.
- **Static operations**: Path operations like `Stroke()`, `Trim()`, `Simplify()` are now static methods on `Skia.Path`

## Basic Migration

### Before (Mutable API)

```tsx
// Building a path
const path = Skia.Path.Make();
path.moveTo(0, 0);
path.lineTo(100, 100);
path.close();

// Adding shapes
const circle = Skia.Path.Make();
circle.addCircle(50, 50, 25);

// Transforming (mutated in place)
path.transform(matrix);

// Operations (mutated in place)
path.stroke({ width: 2 });
path.simplify();
```

### After (Immutable API)

```tsx
// Building a path with PathBuilder
const path = Skia.PathBuilder.Make()
  .moveTo(0, 0)
  .lineTo(100, 100)
  .close()
  .build();

// Adding shapes - use static factories
const circle = Skia.Path.Circle(50, 50, 25);

// Transforming - returns new path
const transformed = path.transform(matrix);

// Operations - use static methods
const stroked = Skia.Path.Stroke(path, { width: 2 });
const simplified = Skia.Path.Simplify(path);
```

## Static Factory Methods

Instead of creating an empty path and calling `add*` methods, use static factories:

| Old API | New API |
|---------|---------|
| `path.addCircle(x, y, r)` | `Skia.Path.Circle(x, y, r)` |
| `path.addRect(rect)` | `Skia.Path.Rect(rect)` |
| `path.addOval(rect)` | `Skia.Path.Oval(rect)` |
| `path.addRRect(rrect)` | `Skia.Path.RRect(rrect)` |
| `path.moveTo()/lineTo()` | `Skia.Path.Line(p1, p2)` |
| Multiple `path.lineTo()` | `Skia.Path.Polygon(points, close)` |

## Static Path Operations

Operations that previously mutated the path are now static methods returning new paths:

| Old API | New API |
|---------|---------|
| `path.stroke(opts)` | `Skia.Path.Stroke(path, opts)` |
| `path.trim(start, end)` | `Skia.Path.Trim(path, start, end, false)` |
| `path.simplify()` | `Skia.Path.Simplify(path)` |
| `path.dash(on, off, phase)` | `Skia.Path.Dash(path, on, off, phase)` |
| `path.makeAsWinding()` | `Skia.Path.AsWinding(path)` |
| `path1.interpolate(path2, t)` | `Skia.Path.Interpolate(path1, path2, t)` |

Note: Static operations may return `null` if the operation fails. Handle this appropriately:

```tsx
const stroked = Skia.Path.Stroke(path, { width: 2 });
if (stroked) {
  // use stroked path
}
// Or with fallback
const result = Skia.Path.Stroke(path, { width: 2 }) ?? path;
```

## Transform and Offset

These methods now return new paths instead of mutating:

```tsx
// Before
path.transform(matrix);  // mutated path
path.offset(dx, dy);     // mutated path

// After
const transformed = path.transform(matrix);  // new path
const offsetPath = path.offset(dx, dy);      // new path
```

## Using PathBuilder

When you need to build complex paths programmatically:

```tsx
const builder = Skia.PathBuilder.Make();
builder.moveTo(0, 0);
builder.lineTo(100, 0);
builder.quadTo(150, 50, 100, 100);
builder.cubicTo(50, 150, 0, 100, 0, 50);
builder.close();

// Get the immutable path
const path = builder.build();
```

`PathBuilder` supports method chaining:

```tsx
const path = Skia.PathBuilder.Make()
  .moveTo(0, 0)
  .lineTo(100, 100)
  .arcTo(50, 50, 0, true, true, 100, 0)
  .close()
  .build();
```

## Combining Paths

To combine an existing path with new elements:

```tsx
const basePath = Skia.Path.MakeFromSVGString("M10 10 L90 90")!;
const combined = Skia.PathBuilder.MakeFromPath(basePath)
  .lineTo(90, 10)
  .close()
  .build();
```

## Animations with usePathValue

The `usePathValue` hook now takes an optional transform function:

```tsx
// Before
const clip = usePathValue((path) => {
  "worklet";
  path.transform(matrix.value);
}, initialPath);

// After
const clip = usePathValue(
  () => {
    "worklet";
    // Build operations go here
  },
  initialPath,
  (path) => {
    "worklet";
    // Post-build transform
    return path.transform(matrix.value);
  }
);
```

## Dynamic Path Building in Worklets

When building paths dynamically in worklets (e.g., gesture handlers), use `PathBuilder` as a shared value:

```tsx
const pathBuilder = useSharedValue(Skia.PathBuilder.Make());

const gesture = Gesture.Pan()
  .onStart((e) => {
    pathBuilder.value.reset();
    pathBuilder.value.moveTo(e.x, e.y);
  })
  .onChange((e) => {
    pathBuilder.value.lineTo(e.x, e.y);
  });

// Convert to path for rendering
const path = useDerivedValue(() => {
  return pathBuilder.value.build();
});
```

## Quick Reference

### PathBuilder Methods

Construction:
- `moveTo(x, y)`, `lineTo(x, y)`, `quadTo(...)`, `cubicTo(...)`, `conicTo(...)`
- `rMoveTo(...)`, `rLineTo(...)`, `rQuadTo(...)`, `rCubicTo(...)`, `rConicTo(...)`
- `arcTo(...)`, `arcToOval(...)`, `arcToRotated(...)`
- `addRect(...)`, `addOval(...)`, `addCircle(...)`, `addRRect(...)`, `addArc(...)`, `addPath(...)`
- `close()`, `reset()`
- `setFillType(...)`, `setIsVolatile(...)`
- `build()` → returns immutable `SkPath`

### SkPath Static Methods

Factories:
- `Skia.Path.Circle(x, y, r)`
- `Skia.Path.Rect(rect)`
- `Skia.Path.Oval(rect)`
- `Skia.Path.RRect(rrect)`
- `Skia.Path.Line(p1, p2)`
- `Skia.Path.Polygon(points, close)`

Operations:
- `Skia.Path.Stroke(path, opts)` → `SkPath | null`
- `Skia.Path.Trim(path, start, end, complement)` → `SkPath | null`
- `Skia.Path.Simplify(path)` → `SkPath | null`
- `Skia.Path.Dash(path, on, off, phase)` → `SkPath | null`
- `Skia.Path.AsWinding(path)` → `SkPath | null`
- `Skia.Path.Interpolate(start, end, weight)` → `SkPath | null`

### SkPath Instance Methods (Immutable)

Query:
- `getBounds()`, `computeTightBounds()`, `contains(x, y)`
- `getFillType()`, `isVolatile()`, `isEmpty()`
- `countPoints()`, `getPoint(index)`, `getLastPt()`
- `toSVGString()`, `toCmds()`, `equals(other)`, `copy()`
- `isInterpolatable(other)`

Transform (returns new path):
- `transform(matrix)` → `SkPath`
- `offset(dx, dy)` → `SkPath`