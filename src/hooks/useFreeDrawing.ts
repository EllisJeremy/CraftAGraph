import { useState, useRef, useEffect } from "react";
import { flushSync } from "react-dom";
import { useReactFlow } from "reactflow";
import type { MouseEvent } from "react";
import type { FreePath, FreePoint } from "../types";

export function useFreeDrawing() {
  const { screenToFlowPosition } = useReactFlow();
  const [freeDrawMode, setFreeDrawMode] = useState(false);
  const [freePaths, setFreePaths] = useState<FreePath[]>([]);
  const [currentPath, setCurrentPath] = useState<FreePoint[] | null>(null);
  const [selectedFreePathId, setSelectedFreePathId] = useState<string | null>(null);
  const selectedFreePathIdRef = useRef<string | null>(null);
  selectedFreePathIdRef.current = selectedFreePathId;
  const isDrawing = useRef(false);

  useEffect(() => {
    const isTyping = () => document.activeElement?.tagName === "INPUT";

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTyping()) return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedFreePathIdRef.current) {
        const id = selectedFreePathIdRef.current;
        setFreePaths((paths) => paths.filter((p) => p.id !== id));
        setSelectedFreePathId(null);
      }
      if (e.key === "d" && !e.repeat) {
        setFreeDrawMode(true);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "d") {
        isDrawing.current = false;
        flushSync(() => {
          setFreeDrawMode(false);
          setCurrentPath(null);
        });
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const onDrawMouseDown = (e: MouseEvent) => {
    if (!freeDrawMode) return;
    isDrawing.current = true;
    const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    setCurrentPath([pos]);
  };

  const onDrawMouseMove = (e: MouseEvent) => {
    if (!freeDrawMode || !isDrawing.current) return;
    const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    setCurrentPath((prev) => (prev ? [...prev, pos] : [pos]));
  };

  const onDrawMouseUp = () => {
    if (!freeDrawMode || !isDrawing.current) return;
    isDrawing.current = false;
    setCurrentPath((prev) => {
      if (prev && prev.length >= 2) {
        setFreePaths((paths) => [
          ...paths,
          { id: `fp-${Date.now()}`, points: prev },
        ]);
      }
      return null;
    });
  };

  return {
    freeDrawMode,
    freePaths,
    setFreePaths,
    currentPath,
    selectedFreePathId,
    setSelectedFreePathId,
    onDrawMouseDown,
    onDrawMouseMove,
    onDrawMouseUp,
  };
}
