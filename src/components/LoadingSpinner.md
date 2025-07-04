# 🌀 Centralized Spinner System

We've standardized all loading spinners into a unified component system to ensure consistency across the application.

## 🎯 **Why This Matters**

Previously, we had **60+ different spinner implementations** scattered throughout the codebase with inconsistent:
- Sizes, colors, and styling
- Loading patterns and layouts  
- Maintenance overhead

Now we have **ONE centralized system** with standardized variants for every use case.

## 📦 **Available Components**

### 1. `LoadingSpinner` (Main Component)
The main component with full customization options - supports both circular and running man spinners!

```tsx
import { LoadingSpinner } from '../components/LoadingSpinner'

// Circular spinner (default)
<LoadingSpinner 
  variant="page"
  size="xl" 
  color="blue.500"
  thickness="4px"
  speed="0.65s"
/>

// 🏃‍♂️ Running man spinner (track & field theme!)
<LoadingSpinner 
  variant="page"
  type="running"
  size="xl" 
  speed="0.8s"
/>
```

### 2. `PageSpinner` (Full-Screen Loading)
For full-page loading states (authentication, route loading, etc.)

```tsx
import { PageSpinner } from '../components/LoadingSpinner'

// ✅ Use for: Route loading, authentication, full-page data loading
<PageSpinner />
<PageSpinner size="lg" color="red.500" />
```

### 3. `CardSpinner` (Content Areas)
For loading states within cards, modals, or content sections.

```tsx
import { CardSpinner } from '../components/LoadingSpinner'

// ✅ Use for: Data tables, card content, modal content
<CardSpinner />
<CardSpinner size="md" />
```

### 4. `ButtonSpinner` (Interactive Elements) 
For loading states in buttons, form submissions, etc.

```tsx
import { ButtonSpinner } from '../components/LoadingSpinner'

// ✅ Use for: Button loading states, form submissions
<Button leftIcon={isLoading ? <ButtonSpinner /> : <FaSave />}>
  Save
</Button>
```

### 5. `InlineSpinner` (Text/Inline Context)
For loading states inline with text or smaller UI elements.

```tsx
import { InlineSpinner } from '../components/LoadingSpinner'

// ✅ Use for: Inline loading, status indicators
<Text>Loading data <InlineSpinner size="xs" /></Text>
```

### 6. `RunningSpinner` (Direct Component)
Use the running man spinner directly with full control.

```tsx
import { RunningSpinner } from '../components/RunningSpinner'

// ✅ Direct usage with custom props
<RunningSpinner size="lg" speed="1s" color="dark" />
```

### 7. Running Man Convenience Components 🏃‍♂️
Pre-configured running man spinners for track & field themed loading.

```tsx
import { RunningPageSpinner, RunningCardSpinner, RunningInlineSpinner } from '../components/LoadingSpinner'

// ✅ Full-page running man
<RunningPageSpinner />

// ✅ Card/modal running man  
<RunningCardSpinner />

// ✅ Inline running man
<RunningInlineSpinner />
```

## 🎨 **Variants & Use Cases**

| Variant | Use Case | Examples |
|---------|----------|----------|
| `page` | Full-screen loading | Route changes, authentication |
| `card` | Content area loading | Data tables, modals, cards |
| `button` | Interactive loading | Form submissions, actions |
| `inline` | Text/small UI loading | Status updates, inline data |
| `overlay` | Modal overlay loading | Processing overlays |
| `minimal` | Just the spinner | Custom layouts |

## 🔧 **Migration Guide**

### Before (Multiple Patterns)
```tsx
// ❌ OLD - Inconsistent patterns everywhere
<Spinner size="xl" color="blue.500" thickness="4px" />
<Center><Spinner size="lg" /></Center>
<Box ml={2}><Spinner size="sm" /></Box>

// ❌ OLD - Full-screen loading
<Flex h="100vh" justify="center" align="center">
  <Spinner size="xl" color="blue.500" />
</Flex>
```

### After (Centralized System)
```tsx
// ✅ NEW - Consistent, semantic components
<PageSpinner />
<CardSpinner />  
<InlineSpinner />

// ✅ NEW - Full-screen loading
<PageSpinner />
```

## 📝 **Quick Reference**

```tsx
// CIRCULAR SPINNERS (Default)
// ============================
// Full-page loading (auth, routes)
<PageSpinner />

// Card/modal content loading  
<CardSpinner />

// Button loading states
<ButtonSpinner />

// Inline/text loading
<InlineSpinner />

// RUNNING MAN SPINNERS 🏃‍♂️ (Track & Field Theme)
// ================================================
// Full-page running man
<RunningPageSpinner />

// Card/modal running man
<RunningCardSpinner />

// Inline running man
<RunningInlineSpinner />

// Direct running man usage
<RunningSpinner size="xl" speed="0.6s" />

// CUSTOM CONFIGURATIONS
// ====================
// Mixed type configurations
<LoadingSpinner 
  variant="card"
  type="running"
  size="md" 
  speed="1s"
/>

<LoadingSpinner 
  variant="page"
  type="circle"
  size="lg"
  color="red.500"
  thickness="2px"
/>
```

## 🚀 **Benefits**

- ✅ **Consistency**: All spinners look and behave the same
- ✅ **Maintainability**: Update styling in one place
- ✅ **Type Safety**: TypeScript support for all variants
- ✅ **Performance**: Optimized rendering patterns
- ✅ **Accessibility**: Built-in ARIA labels and semantic markup

## 🔄 **Next Steps**

1. **Use these components** for all new loading states
2. **Gradually migrate** existing `<Spinner>` usages during feature work
3. **Update during code reviews** when touching spinner-related code

---

*For questions or new spinner patterns, discuss with the team before creating custom implementations.* 