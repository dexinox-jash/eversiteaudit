import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Image, Pressable, TextInput, Dimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Svg, {
  Line,
  Circle as SvgCircle,
  Rect as SvgRect,
  Polyline,
  Polygon,
  Text as SvgText,
} from 'react-native-svg';
import {
  ArrowRight,
  Circle,
  Square,
  Pencil,
  Type,
  Undo2,
  Redo2,
  Save,
  X,
} from 'lucide-react-native';
import { useTheme } from '@components/ThemeProvider';
import { Typography } from '@components/Typography';
import { usePhotoStore } from '@store/usePhotoStore';
import { useAnnotationStore } from '@store/useAnnotationStore';
import { spacing, radius, touchTargets } from '@theme/index';
import type { Annotation, AnnotationType } from '@/types/domain';

const SCREEN = Dimensions.get('window');

const TOOLS: { type: AnnotationType | 'freehand'; icon: React.ElementType; label: string }[] = [
  { type: 'arrow', icon: ArrowRight, label: 'Arrow' },
  { type: 'circle', icon: Circle, label: 'Circle' },
  { type: 'rectangle', icon: Square, label: 'Rectangle' },
  { type: 'highlight', icon: Pencil, label: 'Pen' },
  { type: 'text', icon: Type, label: 'Text' },
];

const PRESET_COLORS = ['#FF4757', '#FF8C42', '#FFD166', '#06D6A0', '#4A9EFF', '#FFFFFF', '#000000'];

interface DisplayBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

function computeImageBounds(
  containerWidth: number,
  containerHeight: number,
  imageWidth: number | null,
  imageHeight: number | null
): DisplayBounds {
  if (!imageWidth || !imageHeight || imageWidth <= 0 || imageHeight <= 0) {
    return { left: 0, top: 0, width: containerWidth, height: containerHeight };
  }
  const containerRatio = containerWidth / containerHeight;
  const imageRatio = imageWidth / imageHeight;
  if (imageRatio > containerRatio) {
    const width = containerWidth;
    const height = containerWidth / imageRatio;
    return { left: 0, top: (containerHeight - height) / 2, width, height };
  }
  const height = containerHeight;
  const width = containerHeight * imageRatio;
  return { left: (containerWidth - width) / 2, top: 0, width, height };
}

function toNormalized(x: number, y: number, bounds: DisplayBounds): { x: number; y: number } {
  return {
    x: bounds.width > 0 ? (x - bounds.left) / bounds.width : 0,
    y: bounds.height > 0 ? (y - bounds.top) / bounds.height : 0,
  };
}

function fromNormalized(nx: number, ny: number, bounds: DisplayBounds): { x: number; y: number } {
  return {
    x: nx * bounds.width + bounds.left,
    y: ny * bounds.height + bounds.top,
  };
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export default function AnnotateScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { photos } = usePhotoStore();
  const { annotations: savedAnnotations, loadAnnotations } = useAnnotationStore();

  const photo = useMemo(() => photos.find((p) => p.id === id), [photos, id]);

  const [containerSize, setContainerSize] = useState({
    width: SCREEN.width,
    height: SCREEN.height,
  });
  const bounds = useMemo(
    () =>
      computeImageBounds(
        containerSize.width,
        containerSize.height,
        photo?.width ?? null,
        photo?.height ?? null
      ),
    [containerSize, photo]
  );

  const [tool, setTool] = useState<AnnotationType | 'freehand'>('arrow');
  const [color, setColor] = useState('#FF4757');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [workingAnnotations, setWorkingAnnotations] = useState<Annotation[]>([]);
  const [history, setHistory] = useState<Annotation[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [isDrawing, setIsDrawing] = useState(false);
  const currentAnnotationRef = useRef<Annotation | null>(null);
  const [freehandPoints, setFreehandPoints] = useState<{ x: number; y: number }[]>([]);

  const [textInputVisible, setTextInputVisible] = useState(false);
  const [textInputValue, setTextInputValue] = useState('');
  const [textInputPosition, setTextInputPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (id) {
      void loadAnnotations(id);
    }
  }, [id, loadAnnotations]);

  useEffect(() => {
    setWorkingAnnotations(savedAnnotations);
    setHistory([savedAnnotations]);
    setHistoryIndex(0);
  }, [savedAnnotations]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const pushHistory = useCallback(
    (nextAnnotations: Annotation[]) => {
      setHistory((prev) => {
        const trimmed = prev.slice(0, historyIndex + 1);
        const next = [...trimmed, nextAnnotations];
        if (next.length > 11) {
          next.shift();
          return next;
        }
        return next;
      });
      setHistoryIndex((prev) => {
        const next = prev + 1;
        return next > 10 ? 10 : next;
      });
      setWorkingAnnotations(nextAnnotations);
    },
    [historyIndex]
  );

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    const nextIndex = historyIndex - 1;
    setHistoryIndex(nextIndex);
    setWorkingAnnotations(history[nextIndex] ?? []);
  }, [canUndo, history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    const nextIndex = historyIndex + 1;
    setHistoryIndex(nextIndex);
    setWorkingAnnotations(history[nextIndex] ?? []);
  }, [canRedo, history, historyIndex]);

  const handleSave = useCallback(async () => {
    const state = useAnnotationStore.getState();
    const originalMap = new Map(savedAnnotations.map((a) => [a.id, a]));
    const workingMap = new Map(workingAnnotations.map((a) => [a.id, a]));

    for (const orig of savedAnnotations) {
      if (!workingMap.has(orig.id)) {
        await state.deleteAnnotation(orig.id);
      }
    }

    for (const ann of workingAnnotations) {
      if (originalMap.has(ann.id)) {
        const orig = originalMap.get(ann.id)!;
        const hasChanges =
          ann.type !== orig.type ||
          ann.x !== orig.x ||
          ann.y !== orig.y ||
          ann.width !== orig.width ||
          ann.height !== orig.height ||
          ann.rotation !== orig.rotation ||
          ann.color !== orig.color ||
          ann.strokeWidth !== orig.strokeWidth ||
          ann.textContent !== orig.textContent ||
          ann.fontSize !== orig.fontSize;
        if (hasChanges) {
          await state.updateAnnotation(ann.id, {
            type: ann.type,
            x: ann.x,
            y: ann.y,
            width: ann.width,
            height: ann.height,
            rotation: ann.rotation,
            color: ann.color,
            strokeWidth: ann.strokeWidth,
            textContent: ann.textContent,
            fontSize: ann.fontSize,
          });
        }
      } else {
        await state.addAnnotation({
          photoId: id,
          type: ann.type,
          x: ann.x,
          y: ann.y,
          width: ann.width,
          height: ann.height,
          rotation: ann.rotation,
          color: ann.color,
          strokeWidth: ann.strokeWidth,
          textContent: ann.textContent,
          fontSize: ann.fontSize,
          isDeleted: 0,
          deletedAt: null,
        });
      }
    }
    router.back();
  }, [workingAnnotations, savedAnnotations, id]);

  const startAnnotation = useCallback(
    (x: number, y: number) => {
      const norm = toNormalized(x, y, bounds);
      const clamped = { x: clamp01(norm.x), y: clamp01(norm.y) };
      const now = Date.now();
      const base: Annotation = {
        id: crypto.randomUUID(),
        photoId: id,
        type: tool === 'freehand' ? 'highlight' : tool,
        x: clamped.x,
        y: clamped.y,
        width: null,
        height: null,
        rotation: 0,
        color,
        strokeWidth,
        textContent: null,
        fontSize: tool === 'text' ? 16 : null,
        createdAt: now,
        updatedAt: now,
        isDeleted: 0,
        deletedAt: null,
      };

      if (tool === 'text') {
        const screenPos = fromNormalized(clamped.x, clamped.y, bounds);
        setTextInputPosition(screenPos);
        setTextInputVisible(true);
        setTextInputValue('');
        currentAnnotationRef.current = base;
        return;
      }

      if (tool === 'highlight') {
        setFreehandPoints([clamped]);
        currentAnnotationRef.current = base;
      } else if (tool === 'arrow') {
        currentAnnotationRef.current = { ...base, width: clamped.x, height: clamped.y };
      } else if (tool === 'circle') {
        currentAnnotationRef.current = { ...base, width: 0 };
      } else if (tool === 'rectangle') {
        currentAnnotationRef.current = { ...base, width: 0, height: 0 };
      }
      setIsDrawing(true);
    },
    [bounds, color, id, strokeWidth, tool]
  );

  const updateAnnotationDrawing = useCallback(
    (x: number, y: number) => {
      if (!isDrawing || !currentAnnotationRef.current) return;
      const norm = toNormalized(x, y, bounds);
      const clamped = { x: clamp01(norm.x), y: clamp01(norm.y) };
      const current = currentAnnotationRef.current;

      if (tool === 'highlight') {
        setFreehandPoints((prev) => [...prev, clamped]);
      } else if (tool === 'arrow') {
        currentAnnotationRef.current = { ...current, width: clamped.x, height: clamped.y };
      } else if (tool === 'circle') {
        const dx = clamped.x - current.x;
        const dy = clamped.y - current.y;
        const radius = Math.sqrt(dx * dx + dy * dy);
        currentAnnotationRef.current = { ...current, width: radius };
      } else if (tool === 'rectangle') {
        currentAnnotationRef.current = {
          ...current,
          width: clamped.x - current.x,
          height: clamped.y - current.y,
        };
      }
    },
    [bounds, isDrawing, tool]
  );

  const finishAnnotation = useCallback(() => {
    if (!currentAnnotationRef.current) return;
    const current = currentAnnotationRef.current;

    if (tool === 'highlight') {
      if (freehandPoints.length > 1) {
        const next = {
          ...current,
          textContent: JSON.stringify(freehandPoints),
        };
        pushHistory([...workingAnnotations, next]);
      }
      setFreehandPoints([]);
    } else if (tool === 'arrow') {
      if (
        current.width !== null &&
        current.height !== null &&
        (current.width !== current.x || current.height !== current.y)
      ) {
        pushHistory([...workingAnnotations, current]);
      }
    } else if (tool === 'circle') {
      if (current.width !== null && current.width > 0.005) {
        pushHistory([...workingAnnotations, current]);
      }
    } else if (tool === 'rectangle') {
      if (
        current.width !== null &&
        current.height !== null &&
        (Math.abs(current.width) > 0.005 || Math.abs(current.height) > 0.005)
      ) {
        pushHistory([...workingAnnotations, current]);
      }
    }

    currentAnnotationRef.current = null;
    setIsDrawing(false);
  }, [freehandPoints, pushHistory, tool, workingAnnotations]);

  const handleTouchStart = useCallback(
    (event: { nativeEvent: { locationX: number; locationY: number } }) => {
      startAnnotation(event.nativeEvent.locationX, event.nativeEvent.locationY);
    },
    [startAnnotation]
  );

  const handleTouchMove = useCallback(
    (event: { nativeEvent: { locationX: number; locationY: number } }) => {
      updateAnnotationDrawing(event.nativeEvent.locationX, event.nativeEvent.locationY);
    },
    [updateAnnotationDrawing]
  );

  const handleTouchEnd = useCallback((): void => {
    finishAnnotation();
  }, [finishAnnotation]);

  const handleTextSubmit = useCallback(() => {
    if (!currentAnnotationRef.current || !textInputPosition || !textInputValue.trim()) {
      setTextInputVisible(false);
      currentAnnotationRef.current = null;
      return;
    }
    const norm = toNormalized(textInputPosition.x, textInputPosition.y, bounds);
    const ann: Annotation = {
      ...currentAnnotationRef.current,
      x: clamp01(norm.x),
      y: clamp01(norm.y),
      textContent: textInputValue.trim(),
    };
    pushHistory([...workingAnnotations, ann]);
    setTextInputVisible(false);
    setTextInputValue('');
    currentAnnotationRef.current = null;
  }, [bounds, pushHistory, textInputPosition, textInputValue, workingAnnotations]);

  const renderAnnotationSvg = useCallback(
    (ann: Annotation, key?: string) => {
      const p1 = fromNormalized(ann.x, ann.y, bounds);
      const sw = ann.strokeWidth;

      if (ann.type === 'arrow' && ann.width !== null && ann.height !== null) {
        const p2 = fromNormalized(ann.width, ann.height, bounds);
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const arrowLen = 12;
        const arrowAngle = Math.PI / 6;
        const x3 = p2.x - arrowLen * Math.cos(angle - arrowAngle);
        const y3 = p2.y - arrowLen * Math.sin(angle - arrowAngle);
        const x4 = p2.x - arrowLen * Math.cos(angle + arrowAngle);
        const y4 = p2.y - arrowLen * Math.sin(angle + arrowAngle);
        return (
          <React.Fragment key={key ?? ann.id}>
            <Line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={ann.color} strokeWidth={sw} />
            <Polygon points={`${p2.x},${p2.y} ${x3},${y3} ${x4},${y4}`} fill={ann.color} />
          </React.Fragment>
        );
      }

      if (ann.type === 'circle' && ann.width !== null) {
        const r = ann.width * Math.min(bounds.width, bounds.height);
        return (
          <SvgCircle
            key={key ?? ann.id}
            cx={p1.x}
            cy={p1.y}
            r={r}
            stroke={ann.color}
            strokeWidth={sw}
            fill="none"
          />
        );
      }

      if (ann.type === 'rectangle' && ann.width !== null && ann.height !== null) {
        const rw = ann.width * bounds.width;
        const rh = ann.height * bounds.height;
        return (
          <SvgRect
            key={key ?? ann.id}
            x={p1.x}
            y={p1.y}
            width={rw}
            height={rh}
            stroke={ann.color}
            strokeWidth={sw}
            fill="none"
          />
        );
      }

      if (ann.type === 'highlight' && ann.textContent) {
        try {
          const points = JSON.parse(ann.textContent) as unknown as { x: number; y: number }[];
          const pts = points
            .map((pt) => {
              const sp = fromNormalized(pt.x, pt.y, bounds);
              return `${sp.x},${sp.y}`;
            })
            .join(' ');
          return (
            <Polyline
              key={key ?? ann.id}
              points={pts}
              fill="none"
              stroke={ann.color}
              strokeWidth={sw}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        } catch {
          return null;
        }
      }

      if (ann.type === 'text' && ann.textContent) {
        const fontSize = ann.fontSize ?? 16;
        return (
          <SvgText
            key={key ?? ann.id}
            x={p1.x}
            y={p1.y}
            fill={ann.color}
            fontSize={fontSize}
            fontWeight="600"
          >
            {ann.textContent}
          </SvgText>
        );
      }

      return null;
    },
    [bounds]
  );

  const renderPreview = useCallback(() => {
    const current = currentAnnotationRef.current;
    if (!current) return null;

    if (tool === 'highlight' && freehandPoints.length > 1) {
      const pts = freehandPoints
        .map((pt) => {
          const sp = fromNormalized(pt.x, pt.y, bounds);
          return `${sp.x},${sp.y}`;
        })
        .join(' ');
      return (
        <Polyline
          points={pts}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    }

    return renderAnnotationSvg(current, 'preview');
  }, [color, freehandPoints, renderAnnotationSvg, strokeWidth, tool, bounds]);

  if (!photo) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Typography variant="body" color="secondary">
            Photo not found
          </Typography>
          <Pressable
            onPress={() => router.back()}
            style={[styles.button, { marginTop: spacing['4'] }]}
          >
            <Typography variant="body" color="primary">
              Go Back
            </Typography>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={styles.canvas}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setContainerSize({ width, height });
        }}
      >
        <Image
          source={{ uri: photo.originalPath }}
          style={styles.image}
          resizeMode="contain"
          accessibilityRole="image"
          accessibilityLabel="Photo to annotate"
        />
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          {workingAnnotations.map((ann) => renderAnnotationSvg(ann))}
          {renderPreview()}
        </Svg>
        <View
          style={StyleSheet.absoluteFill}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          accessible={true}
          accessibilityLabel="Annotation canvas"
          accessibilityHint="Draw annotations on the photo"
        />
      </View>

      {/* Top Bar */}
      <View style={[styles.topBar, { top: insets.top + spacing['2'] }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.circleButton, { backgroundColor: colors.scrim }]}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close annotation"
        >
          <X size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.topBarRight}>
          <Pressable
            onPress={handleUndo}
            style={[
              styles.circleButton,
              { opacity: canUndo ? 1 : 0.4, backgroundColor: colors.scrim },
            ]}
            disabled={!canUndo}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Undo"
          >
            <Undo2 size={22} color={colors.textPrimary} />
          </Pressable>
          <Pressable
            onPress={handleRedo}
            style={[
              styles.circleButton,
              { opacity: canRedo ? 1 : 0.4, backgroundColor: colors.scrim },
            ]}
            disabled={!canRedo}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Redo"
          >
            <Redo2 size={22} color={colors.textPrimary} />
          </Pressable>
          <Pressable
            onPress={() => {
              void handleSave();
            }}
            style={[styles.circleButton, { backgroundColor: colors.scrim }]}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Save annotations"
          >
            <Save size={22} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      {/* Text Input Overlay */}
      {textInputVisible && textInputPosition && (
        <View
          style={[
            styles.textInputContainer,
            { left: textInputPosition.x, top: textInputPosition.y },
          ]}
          pointerEvents="box-none"
        >
          <TextInput
            value={textInputValue}
            onChangeText={setTextInputValue}
            onSubmitEditing={handleTextSubmit}
            onBlur={handleTextSubmit}
            autoFocus
            style={[
              styles.textInput,
              {
                color: colors.textPrimary,
                backgroundColor: colors.backgroundSecondary,
                minWidth: 120,
              },
            ]}
            placeholder="Type here..."
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      )}

      {/* Bottom Toolbar */}
      <View
        style={[
          styles.toolbar,
          {
            backgroundColor: colors.backgroundSecondary,
            paddingBottom: insets.bottom + spacing['3'],
            paddingTop: spacing['4'],
          },
        ]}
      >
        {/* Tools */}
        <View style={styles.toolRow}>
          {TOOLS.map((t) => {
            const Icon = t.icon;
            const isActive = tool === t.type;
            return (
              <Pressable
                key={t.type}
                onPress={() => setTool(t.type)}
                style={[
                  styles.toolButton,
                  {
                    backgroundColor: isActive ? colors.primary : 'transparent',
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t.label}
                accessibilityState={{ selected: isActive }}
                hitSlop={8}
              >
                <Icon size={20} color={isActive ? colors.primaryForeground : colors.textPrimary} />
              </Pressable>
            );
          })}
        </View>

        {/* Colors */}
        <View style={styles.colorRow}>
          {PRESET_COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              style={[
                styles.colorButton,
                { backgroundColor: c },
                color === c && { borderColor: colors.textPrimary, borderWidth: 2 },
              ]}
              hitSlop={4}
              accessibilityRole="button"
              accessibilityLabel={`Select color ${c}`}
              accessibilityState={{ selected: color === c }}
            />
          ))}
        </View>

        {/* Stroke Width */}
        <View style={styles.sliderRow}>
          <Typography variant="caption" color="secondary">
            Width
          </Typography>
          <Pressable
            onPress={() => setStrokeWidth((w) => Math.max(1, w - 1))}
            style={styles.widthButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Decrease stroke width"
          >
            <Typography variant="body" color="primary">
              -
            </Typography>
          </Pressable>
          <View
            style={[styles.slider, { backgroundColor: colors.border }]}
            accessibilityRole="adjustable"
            accessibilityLabel="Stroke width"
            accessibilityValue={{ now: strokeWidth, min: 1, max: 8 }}
          >
            <View
              style={{
                backgroundColor: colors.primary,
                height: 4,
                borderRadius: 2,
                width: `${((strokeWidth - 1) / 7) * 100}%`,
              }}
            />
          </View>
          <Pressable
            onPress={() => setStrokeWidth((w) => Math.min(8, w + 1))}
            style={styles.widthButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Increase stroke width"
          >
            <Typography variant="body" color="primary">
              +
            </Typography>
          </Pressable>
          <Typography variant="caption" color="primary" style={styles.sliderValue}>
            {strokeWidth}
          </Typography>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  canvas: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing['4'],
    zIndex: 5,
  },
  topBarRight: {
    flexDirection: 'row',
    gap: spacing['3'],
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  button: {
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['2'],
  },
  textInputContainer: {
    position: 'absolute',
    zIndex: 20,
  },
  textInput: {
    paddingHorizontal: spacing['2'],
    paddingVertical: spacing['1'],
    borderRadius: radius.md,
    fontSize: 16,
    fontWeight: '600',
  },
  toolbar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing['4'],
    zIndex: 10,
  },
  toolRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing['4'],
  },
  toolButton: {
    width: touchTargets.minimum,
    height: touchTargets.minimum,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing['3'],
    marginBottom: spacing['4'],
  },
  colorButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.3)',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['3'],
  },
  slider: {
    flex: 1,
    height: 32,
  },
  sliderValue: {
    width: 20,
    textAlign: 'center',
  },
  widthButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
