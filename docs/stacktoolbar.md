---
modificationDate: June 03, 2026
title: Stack Toolbar
description: Learn how to use the native toolbar in Stack navigation with Expo Router.
---

<AgentInstructions>

## Submitting Feedback

If this page contains errors, outdated information, or gaps that blocked you from completing a task, report it so the docs can be improved:

curl -X POST https://api.expo.dev/v2/feedback/docs-send -H 'Content-Type: application/json' -d '{"url":"/router/advanced/stack-toolbar/","feedback":"🤖 Agent feedback for docs: <specific, actionable description> (<model>, <harness>)"}'

Only submit when you have something specific and actionable to report. Replace <model> with the model you are running as and <harness> with the tool you are running in (for example, Claude Code, Cursor, Codex CLI).

## Navigation

When answering a related or follow-up question, fetch the relevant page below as Markdown (.md) instead of guessing; use llms.txt for the full map.

You are here: Guides > Expo Router > Advanced
Pages in this section:
- [Platform-specific extensions and module](https://docs.expo.dev/router/advanced/platform-specific-modules.md)
- [Customizing links](https://docs.expo.dev/router/advanced/native-intent.md)
- [Settings](https://docs.expo.dev/router/advanced/router-settings.md)
- [Apple Handoff](https://docs.expo.dev/router/advanced/apple-handoff.md)
- [Custom tabs](https://docs.expo.dev/router/advanced/custom-tabs.md)
- [Custom navigators](https://docs.expo.dev/router/advanced/custom-navigators.md)
- [Stack Toolbar](https://docs.expo.dev/router/advanced/stack-toolbar.md) (this page)
- [Zoom transition](https://docs.expo.dev/router/advanced/zoom-transition.md)
Full documentation tree: [llms.txt](https://docs.expo.dev/llms.txt)

</AgentInstructions>

# Stack Toolbar

Learn how to use the native toolbar in Stack navigation with Expo Router.

> `Stack.Toolbar` is an [alpha](/more/release-statuses.md#alpha) API available on Android in **Expo SDK 56** and later, and on iOS in **Expo SDK 55** and later. The API is subject to breaking changes.

[`Stack.Toolbar`](/versions/latest/sdk/router/stack.md#stacktoolbar) lets you add native toolbar items to your Stack screens on Android and iOS. You can place buttons, menus, and custom views in the header (left or right side) or in the bottom toolbar.

## Adding header buttons

Use [`Stack.Toolbar.Button`](/versions/latest/sdk/router/stack.md#stacktoolbarbutton) within `Stack.Toolbar` with `placement="right"` or `placement="left"` to add buttons to the navigation header. This is useful for actions like favoriting, sharing, or editing content.

#### Android

```tsx
import { useState } from 'react';
import { Stack } from 'expo-router';
import { View, Text, Alert } from 'react-native';

export default function NoteScreen() {
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          // Replace with your own icons
          icon={isFavorite ? require('./assets/star-filled.png') : require('./assets/star.png')}
          onPress={() => setIsFavorite(!isFavorite)}
        />
        <Stack.Toolbar.Button
          icon={require('./assets/share.png')}
          onPress={() => Alert.alert('Share')}
        />
      </Stack.Toolbar>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button
          icon={require('./assets/sidebar.png')}
          onPress={() => Alert.alert('Sidebar')}
        />
      </Stack.Toolbar>

      <View style={{ flex: 1, padding: 16 }}>
        <Text>Note content...</Text>
      </View>
    </>
  );
}
```

#### iOS

```tsx
import { useState } from 'react';
import { Stack } from 'expo-router';
import { View, Text, Alert } from 'react-native';

export default function NoteScreen() {
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon={isFavorite ? 'star.fill' : 'star'}
          onPress={() => setIsFavorite(!isFavorite)}
        />
        <Stack.Toolbar.Button icon="square.and.arrow.up" onPress={() => Alert.alert('Share')} />
      </Stack.Toolbar>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button icon="sidebar.left" onPress={() => Alert.alert('Sidebar')} />
      </Stack.Toolbar>

      <View style={{ flex: 1, padding: 16 }}>
        <Text>Note content...</Text>
      </View>
    </>
  );
}
```

## Icons

Toolbar buttons accept SF Symbols (iOS only) and custom images (Android and iOS).

### SF Symbols (iOS only)

The easiest way to add icons on iOS is to use [SF Symbols](https://developer.apple.com/sf-symbols/), Apple's built-in icon library. Pass the symbol name directly to the `icon` prop:

```tsx
<Stack.Toolbar.Button icon="star.fill" onPress={() => {}} />
<Stack.Toolbar.Button icon="square.and.arrow.up" onPress={() => {}} />
<Stack.Toolbar.Menu icon="ellipsis.circle">{/* ... */}</Stack.Toolbar.Menu>
```

You can browse available symbols in Apple's SF Symbols app.

> SF Symbols are an iOS-only feature.

### Material Symbols (Android only)

The recommended source of icons for Android is [`@expo/material-symbols`](https://www.npmjs.com/package/@expo/material-symbols) library. It ships Google's [Material Symbols](https://fonts.google.com/icons) as individual asset subpaths, so Metro only bundles the icons you actually import.

```sh
# npm
npx expo install @expo/material-symbols

# yarn
yarn expo install @expo/material-symbols

# pnpm
pnpm expo install @expo/material-symbols

# bun
bun expo install @expo/material-symbols
```

Import any icon directly from its own subpath and pass it to the `icon` prop:

```tsx
import Star from '@expo/material-symbols/star.xml';
import Share from '@expo/material-symbols/share.xml';
import MoreVert from '@expo/material-symbols/more_vert.xml';

<Stack.Toolbar.Button icon={Star} onPress={() => {}} />
<Stack.Toolbar.Button icon={Share} onPress={() => {}} />
<Stack.Toolbar.Menu icon={MoreVert}>{/* ... */}</Stack.Toolbar.Menu>
```

Vector drawables are tinted with the toolbar's tint color by default. Pass `iconRenderingMode="original"` to preserve the source colors.

> Material Symbols XML drawables are an Android-only feature. On iOS, use SF Symbols instead.

#### Using the same icon on Android and iOS

`Stack.Toolbar.Button`'s `icon` prop accepts both an `ImageSourcePropType` (Android) and an SF Symbol name (iOS). To use a single component for both platforms, branch on `process.env.EXPO_OS` and pass the platform-appropriate value. Metro replaces `process.env.EXPO_OS` with a string literal at build time, then tree-shakes the branch that doesn't match the current platform — so the Material Symbols XML drawable never ships in the iOS bundle, and the SF Symbol name never ships in the Android bundle:

```tsx
import Star from '@expo/material-symbols/star.xml';

<Stack.Toolbar.Button
  icon={process.env.EXPO_OS === 'ios' ? 'star.fill' : Star}
  onPress={() => {}}
/>;
```

### Custom images

You can also use custom images. The API for passing them differs by platform:

#### Android

Pass an image to the `icon` prop:

```tsx
import { Stack } from 'expo-router';

export default function Page() {
  return (
    <>
      <Stack.Toolbar>
        <Stack.Toolbar.Button icon={require('./assets/expo.png')} onPress={() => {}} />
      </Stack.Toolbar>
      {/* Screen content */}
    </>
  );
}
```

Image-source icons are tinted with the toolbar's tint color by default (`iconRenderingMode` defaults to `'template'`). Pass `iconRenderingMode="original"` to keep the source's original colors, useful for multi-color icons:

```tsx
import { Stack } from 'expo-router';

export default function Page() {
  return (
    <>
      <Stack.Toolbar>
        <Stack.Toolbar.Button
          icon={require('./assets/expo.png')}
          iconRenderingMode="original"
          onPress={() => {}}
        />
      </Stack.Toolbar>
      {/* Screen content */}
    </>
  );
}
```

#### iOS

iOS uses two different APIs depending on placement: pass an image source directly to `icon` for header toolbars, and use `useImage` with the `image` prop for the bottom toolbar.

> Using custom images inside submenus (`Stack.Toolbar.Menu`) in header placements requires `react-native-screens` 4.24.0 or later. SDK 55 bundles `~4.23.0`, so you need to install `react-native-screens@~4.24.0` manually to use this feature. SDK 56 bundles a compatible version by default.

```tsx
import { Stack } from 'expo-router';

export default function Page() {
  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon={require('./assets/expo.png')} onPress={() => {}} />
      </Stack.Toolbar>
      {/* Screen content */}
    </>
  );
}
```

In the bottom toolbar, use the `useImage` hook from `expo-image` and pass the result to the `image` prop:

```tsx
import { Stack } from 'expo-router';
import { useImage } from 'expo-image';

export default function Page() {
  const customIcon = useImage('https://simpleicons.org/icons/expo.svg', {
    maxWidth: 24,
    maxHeight: 24,
  });

  return (
    <>
      <Stack.Toolbar>
        <Stack.Toolbar.Button image={customIcon} onPress={() => {}} />
      </Stack.Toolbar>
      {/* Screen content */}
    </>
  );
}
```

> The `useImage` and `image` prop pattern for bottom toolbar custom images is iOS-only and is a temporary API that may change in future releases.

## Building action menus

For screens with multiple actions, use [`Stack.Toolbar.Menu`](/versions/latest/sdk/router/stack.md#stacktoolbarmenu) to group them into a dropdown menu:

> Some [`Stack.Toolbar.Menu`](/versions/latest/sdk/router/stack.md#stacktoolbarmenu) and [`Stack.Toolbar.MenuAction`](/versions/latest/sdk/router/stack.md#stacktoolbarmenuaction) props are iOS-only. See the API reference for per-prop platform availability.

#### Android

```tsx
import { useState } from 'react';
import { Stack } from 'expo-router';
import { Alert } from 'react-native';

export default function EmailScreen() {
  const [isArchived, setIsArchived] = useState(false);

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu icon={require('./assets/menu.png')}>
          <Stack.Toolbar.MenuAction
            icon={require('./assets/reply.png')}
            onPress={() => Alert.alert('Reply')}>
            Reply
          </Stack.Toolbar.MenuAction>

          <Stack.Toolbar.MenuAction
            icon={require('./assets/forward.png')}
            onPress={() => Alert.alert('Forward')}>
            Forward
          </Stack.Toolbar.MenuAction>

          <Stack.Toolbar.MenuAction
            icon={isArchived ? require('./assets/unarchive.png') : require('./assets/archive.png')}
            isOn={isArchived}
            onPress={() => setIsArchived(!isArchived)}>
            {isArchived ? 'Unarchive' : 'Archive'}
          </Stack.Toolbar.MenuAction>

          <Stack.Toolbar.MenuAction
            icon={require('./assets/trash.png')}
            destructive
            onPress={() => Alert.alert('Delete')}>
            Delete
          </Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>
      {/* Email content */}
    </>
  );
}
```

#### iOS

```tsx
import { useState } from 'react';
import { Stack } from 'expo-router';
import { Alert } from 'react-native';

export default function EmailScreen() {
  const [isArchived, setIsArchived] = useState(false);

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu icon="ellipsis.circle">
          <Stack.Toolbar.MenuAction
            icon="arrowshape.turn.up.left"
            onPress={() => Alert.alert('Reply')}>
            Reply
          </Stack.Toolbar.MenuAction>

          <Stack.Toolbar.MenuAction
            icon="arrowshape.turn.up.right"
            onPress={() => Alert.alert('Forward')}>
            Forward
          </Stack.Toolbar.MenuAction>

          <Stack.Toolbar.MenuAction
            icon={isArchived ? 'tray.full' : 'archivebox'}
            isOn={isArchived}
            onPress={() => setIsArchived(!isArchived)}>
            {isArchived ? 'Unarchive' : 'Archive'}
          </Stack.Toolbar.MenuAction>

          <Stack.Toolbar.MenuAction icon="trash" destructive onPress={() => Alert.alert('Delete')}>
            Delete
          </Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>
      {/* Email content */}
    </>
  );
}
```

### Nested submenus

For more complex menus, nest `Stack.Toolbar.Menu` inside another menu. Use the `inline` prop to display submenu items directly without collapsing:

#### Android

```tsx
import { useState } from 'react';
import { Stack } from 'expo-router';

export default function EmailScreen() {
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('name');
  const [showHiddenFiles, setShowHiddenFiles] = useState(false);

  return (
    <>
      <Stack.Toolbar>
        <Stack.Toolbar.Menu icon={require('./assets/menu.png')}>
          {/* Inline submenu - options appear directly in the menu */}
          <Stack.Toolbar.Menu inline title="Sort By">
            <Stack.Toolbar.MenuAction isOn={sortBy === 'name'} onPress={() => setSortBy('name')}>
              Name
            </Stack.Toolbar.MenuAction>
            <Stack.Toolbar.MenuAction isOn={sortBy === 'date'} onPress={() => setSortBy('date')}>
              Date
            </Stack.Toolbar.MenuAction>
            <Stack.Toolbar.MenuAction isOn={sortBy === 'size'} onPress={() => setSortBy('size')}>
              Size
            </Stack.Toolbar.MenuAction>
          </Stack.Toolbar.Menu>

          {/* Nested submenu - opens as a separate menu */}
          <Stack.Toolbar.Menu title="Preferences">
            <Stack.Toolbar.MenuAction
              isOn={showHiddenFiles}
              onPress={() => setShowHiddenFiles(!showHiddenFiles)}>
              Show Hidden Files
            </Stack.Toolbar.MenuAction>
          </Stack.Toolbar.Menu>
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>
      {/* Email content */}
    </>
  );
}
```

#### iOS

```tsx
import { useState } from 'react';
import { Stack } from 'expo-router';

export default function EmailScreen() {
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('name');
  const [showHiddenFiles, setShowHiddenFiles] = useState(false);

  return (
    <>
      <Stack.Toolbar>
        <Stack.Toolbar.Menu icon="ellipsis.circle">
          {/* Inline submenu - options appear directly in the menu */}
          <Stack.Toolbar.Menu inline title="Sort By">
            <Stack.Toolbar.MenuAction isOn={sortBy === 'name'} onPress={() => setSortBy('name')}>
              Name
            </Stack.Toolbar.MenuAction>
            <Stack.Toolbar.MenuAction isOn={sortBy === 'date'} onPress={() => setSortBy('date')}>
              Date
            </Stack.Toolbar.MenuAction>
            <Stack.Toolbar.MenuAction isOn={sortBy === 'size'} onPress={() => setSortBy('size')}>
              Size
            </Stack.Toolbar.MenuAction>
          </Stack.Toolbar.Menu>

          {/* Nested submenu - opens as a separate menu */}
          <Stack.Toolbar.Menu title="Preferences">
            <Stack.Toolbar.MenuAction
              isOn={showHiddenFiles}
              onPress={() => setShowHiddenFiles(!showHiddenFiles)}>
              Show Hidden Files
            </Stack.Toolbar.MenuAction>
          </Stack.Toolbar.Menu>
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>
      {/* Email content */}
    </>
  );
}
```

## Using the bottom toolbar

Bottom toolbars are commonly used on iOS for primary screen actions, such as the toolbars in the Photos and Mail apps. To add one, use `Stack.Toolbar` without a placement prop, it defaults to `"bottom"`:

#### Android

```tsx
import { Stack } from 'expo-router';
import { Alert } from 'react-native';

export default function PhotosScreen() {
  return (
    <>
      <Stack.Toolbar>
        <Stack.Toolbar.Button
          icon={require('./assets/select.png')}
          onPress={() => Alert.alert('Select')}
        />
        <Stack.Toolbar.Spacer width={24} />
        <Stack.Toolbar.Button
          icon={require('./assets/plus.png')}
          onPress={() => Alert.alert('Add')}
        />
      </Stack.Toolbar>
    </>
  );
}
```

#### iOS

```tsx
import { Stack } from 'expo-router';
import { Alert } from 'react-native';

export default function PhotosScreen() {
  return (
    <>
      <Stack.Toolbar>
        <Stack.Toolbar.Button icon="photo.on.rectangle" onPress={() => Alert.alert('Select')}>
          Select
        </Stack.Toolbar.Button>
        <Stack.Toolbar.Spacer />
        <Stack.Toolbar.Button icon="plus" onPress={() => Alert.alert('Add')}>
          Add
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
    </>
  );
}
```

> Bottom toolbars can only be used inside page components, not in layout files.

## Spacers

Use [`Stack.Toolbar.Spacer`](/versions/latest/sdk/router/stack.md#stacktoolbarspacer) to add space between toolbar items. Behavior differs by platform:

-   **Android**: `Stack.Toolbar.Spacer` always requires an explicit `width`. There is no flexible-fill spacer at the moment.
-   **iOS**: a `Stack.Toolbar.Spacer` without a `width` creates flexible space between items, pushing them to opposite sides. This is useful for layouts like buttons on both ends of the toolbar. Pass a `width` for fixed-size spacing.

## Adding badges to buttons (iOS only)

In header toolbars, you can add badges to indicate counts or status. Use [`Stack.Toolbar.Icon`](/versions/latest/sdk/router/stack.md#stacktoolbaricon), [`Stack.Toolbar.Label`](/versions/latest/sdk/router/stack.md#stacktoolbarlabel), and [`Stack.Toolbar.Badge`](/versions/latest/sdk/router/stack.md#stacktoolbarbadge) to compose the button content:

```tsx
import { Stack } from 'expo-router';

export default function InboxScreen() {
  const unreadCount = 5;

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button onPress={() => {}}>
          <Stack.Toolbar.Icon sf="bell" />
          <Stack.Toolbar.Label>Notifications</Stack.Toolbar.Label>
          {unreadCount > 0 && <Stack.Toolbar.Badge>{String(unreadCount)}</Stack.Toolbar.Badge>}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      {/* Screen content */}
    </>
  );
}
```

> Badges only work in iOS header placements (`left` or `right`), not in the bottom toolbar nor on Android.

## Embedding custom views

When you need something beyond buttons and menus, use [`Stack.Toolbar.View`](/versions/latest/sdk/router/stack.md#stacktoolbarview) to embed any React Native component:

```tsx
import { Stack } from 'expo-router';
import { Pressable, Alert } from 'react-native';
import { SymbolView } from 'expo-symbols';

export default function SearchScreen() {
  return (
    <>
      <Stack.Toolbar>
        <Stack.Toolbar.View>
          <Pressable
            style={{ width: 32, height: 32, justifyContent: 'center', alignItems: 'center' }}
            onPress={() => {
              Alert.alert('Filter pressed');
            }}>
            <SymbolView
              name={{
                ios: 'line.3.horizontal.decrease.circle',
                android: 'filter_list',
              }}
              size={24}
            />
          </Pressable>
        </Stack.Toolbar.View>
      </Stack.Toolbar>
      {/* Screen content */}
    </>
  );
}
```

## Showing and hiding items dynamically

Use the `hidden` prop to toggle toolbar items based on state:

#### Android

```tsx
import { useState } from 'react';
import { Stack } from 'expo-router';

export default function DocumentScreen() {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          hidden={isEditing}
          icon={require('./assets/pencil.png')}
          onPress={() => setIsEditing(true)}
        />
        <Stack.Toolbar.Button
          hidden={!isEditing}
          icon={require('./assets/check.png')}
          onPress={() => setIsEditing(false)}
        />
      </Stack.Toolbar>
      {/* Document content */}
    </>
  );
}
```

#### iOS

```tsx
import { useState } from 'react';
import { Stack } from 'expo-router';

export default function DocumentScreen() {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button hidden={isEditing} icon="pencil" onPress={() => setIsEditing(true)} />
        <Stack.Toolbar.Button hidden={!isEditing} onPress={() => setIsEditing(false)}>
          Done
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      {/* Document content */}
    </>
  );
}
```

## Common problems

#### Liquid glass toolbar buttons flicker in dark mode on iOS 26

Toolbar buttons with liquid glass styling may flicker or flash their background when navigating between screens in dark mode on iOS 26. This happens because the default theme doesn't match the system dark mode, causing visual artifacts in the liquid glass rendering.

To fix this, wrap your root layout with `<ThemeProvider>` from `expo-router` using the appropriate theme:

```tsx
import { ThemeProvider, DarkTheme, DefaultTheme, Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack />
    </ThemeProvider>
  );
}
```

#### White background flashes when navigating between screens

A white flash between screen transitions usually means the navigation stack is using a light background while your app uses a dark theme. This is especially noticeable when screens contain toolbar items, as the flash contrasts with the toolbar styling.

To fix this, wrap your root layout with Expo Router's `<ThemeProvider>` and pass the appropriate theme:

```tsx
import { ThemeProvider, DarkTheme, DefaultTheme, Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack />
    </ThemeProvider>
  );
}
```

#### Large title does not collapse when scrolling

When using `headerLargeTitle: true` (or `<Stack.Title large>`) alongside `Stack.Toolbar`, the large title may not collapse on scroll. This happens when the scrollable view is not the direct first child of the screen component.

To fix this, ensure `ScrollView` or `FlatList` is the first child rendered by your screen component. If you need a wrapper, set `collapsable={false}` on it:

```tsx
import { Stack } from 'expo-router';
import { ScrollView, View, Text } from 'react-native';

export default function Home() {
  return (
    <ScrollView>
      <Stack.Title large>Home</Stack.Title>
      <Text>Content here</Text>
    </ScrollView>
  );
}
```

If you need to wrap the `ScrollView`, set `collapsable={false}` on the wrapper:

```tsx
import { Stack } from 'expo-router';
import { ScrollView, View, Text } from 'react-native';

export default function Home() {
  return (
    <View collapsable={false}>
      <ScrollView>
        <Stack.Title large>Home</Stack.Title>
        <Text>Content here</Text>
      </ScrollView>
    </View>
  );
}
```

## Known limitations

#### Native only

`Stack.Toolbar` only renders on Android and iOS. Web has no standard toolbar, so you need to implement your own if you need toolbar behavior there.

#### Android icons must be image sources

On Android, `icon` must be an `ImageSourcePropType`. For example `require('./icon.png')` or `{ uri: '...' }`.

You can also use [`Stack.Toolbar.Icon`](/versions/latest/sdk/router/stack.md#stacktoolbaricon) with the `src` prop to provide cross-platform icons.

#### Spacer requires an explicit width on Android

Flexible spacers (`<Stack.Toolbar.Spacer />` with no `width`) are iOS-only. On Android, a `Stack.Toolbar.Spacer` without a `width` renders nothing — pass a fixed `width` such as `<Stack.Toolbar.Spacer width={24} />` in every placement.

#### Bottom toolbar only in page components

The bottom toolbar can only be used inside page components, not in layout files. This is because the bottom toolbar needs to be associated with a specific screen's content.

#### Cannot nest toolbars

You cannot nest `Stack.Toolbar` components inside each other.

#### Badge only in header placements

`Stack.Toolbar.Badge` is only supported when using `placement="left"` or `placement="right"`. Badges are not displayed in the bottom toolbar.

#### Badge and Label primitives are not supported on Android

On Android, `Stack.Toolbar.Button` renders only its icon — the `Stack.Toolbar.Badge` and `Stack.Toolbar.Label` children are dropped. If you need badge-like UI on Android, embed a custom component using [`Stack.Toolbar.View`](/versions/latest/sdk/router/stack.md#stacktoolbarview).

#### SearchBarSlot is not supported on Android

`Stack.Toolbar.SearchBarSlot` renders nothing on Android. Use [`Stack.SearchBar`](/versions/latest/sdk/router/stack.md#stacksearchbar) for cross-platform search bar support.

## Learn more

For complete API documentation, including all available props, see the [`Stack.Toolbar` API reference](/versions/latest/sdk/router/stack.md#stacktoolbar).
