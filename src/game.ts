import { createEffect, createSignal, onMount, onCleanup } from "solid-js";

import {
  flattenMatrix,
  build4x4Matrix,
  rotateMatrixLeft,
  rotateMatrixRight,
  shallowCopyMatrix,
  type Matrix,
} from "./matrix";

const HIGHSCORE_LOCAL_STORAGE_KEY = "highscore";

type Direction = "left" | "right" | "up" | "down";

const N = 4;

type Tile = {
  value: number;
};

const box = (x: number): Tile => ({ value: x });

function spawnRandomTile(arr: Tile[], count = 1): Tile[] {
  const copy = [...arr];

  let created = 0;

  while (created < count) {
    if (copy.every((x) => x.value > 0)) {
      return copy;
    }

    const idx = Math.floor(Math.random() * copy.length);
    if (copy[idx]!.value > 0) {
      continue;
    }

    copy[idx] = box(Math.random() > 0.5 ? 2 : 4);
    created++;
  }

  return copy;
}

function createInitialField(): Tile[] {
  const field = new Array(N * N).fill(0).map((_) => box(0));
  return spawnRandomTile(field, 2);
}

function shiftMatrixRight(input: Matrix<Tile>, addScore: (x: number) => void): Matrix<Tile> {
  const matrix = shallowCopyMatrix(input);

  for (let i = 0; i < N; i++) {
    const row = matrix[i]!;

    // Try to merge
    let canMerge = true;

    for (let j = N - 1 - 1; j >= 0; j--) {
      const currentTile = row[j]!;
      if (currentTile.value === 0) {
        continue;
      }

      let indexToMergeWith = j + 1;
      while (true) {
        if (indexToMergeWith >= N) {
          break;
        }

        const nextTile = row[indexToMergeWith]!;

        if (canMerge && currentTile.value === nextTile.value) {
          row[j] = box(0);
          row[indexToMergeWith] = box(currentTile.value * 2);
          canMerge = false;
          addScore(currentTile.value * 2);
          break;
        }
        if (nextTile.value > 0) {
          break;
        }

        indexToMergeWith++;
      }
    }

    // Move all to right as far as possible
    for (let j = N - 1 - 1; j >= 0; j--) {
      const currentTile = row[j]!;
      if (currentTile.value === 0) {
        continue;
      }

      let indexToMoveTo = j;

      while (true) {
        const nextTile = row[indexToMoveTo + 1];

        if (!nextTile) {
          break;
        }

        if (nextTile.value > 0) {
          break;
        }

        if (indexToMoveTo === N - 1) {
          break;
        }

        if (nextTile.value === 0) {
          indexToMoveTo += 1;
        } else {
          break;
        }
      }

      row[j] = box(0);
      row[indexToMoveTo] = currentTile;
    }
  }

  return matrix;
}

function fieldsAreEqual(a: Tile[], b: Tile[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((a, i) => b[i]!.value === a.value);
}

export function createGame() {
  const [field, setField] = createSignal(createInitialField());
  const [hasWon, setWin] = createSignal(false);
  const [score, setScore] = createSignal(0);
  const [highscore, setHighscore] = createSignal(0);

  function addScore(points: number): void {
    setScore((x) => x + points);

    const newScore = score();

    if (newScore > highscore()) {
      localStorage.setItem(HIGHSCORE_LOCAL_STORAGE_KEY, newScore.toString());
      setHighscore(newScore);
    }
  }

  function reset(): void {
    setField(createInitialField());
    setWin(false);
    setScore(0);
  }

  createEffect(() => {
    if (field().some((x) => x.value === 2_048)) {
      setWin(true);
    }
  });

  function onInput(key: Direction): void {
    if (hasWon()) {
      return;
    }

    let deltaScore = 0;

    function onMove(nextField: Tile[]) {
      if (fieldsAreEqual(field(), nextField)) {
        return;
      }

      setField(spawnRandomTile(nextField));
      addScore(deltaScore);
    }

    const l = rotateMatrixLeft;
    const r = rotateMatrixRight;

    switch (key) {
      case "up": {
        const matrix = build4x4Matrix(field());
        const rotatedMatrixView = r(matrix);
        const shifted = shiftMatrixRight(rotatedMatrixView, (n) => (deltaScore += n));
        const rotatedBack = l(shifted);
        const nextField = flattenMatrix(rotatedBack);
        onMove(nextField);
        break;
      }
      case "down": {
        const matrix = build4x4Matrix(field());
        const rotatedMatrixView = r(r(r(matrix)));
        const shifted = shiftMatrixRight(rotatedMatrixView, (n) => (deltaScore += n));
        const rotatedBack = l(l(l(shifted)));
        const nextField = flattenMatrix(rotatedBack);
        onMove(nextField);
        break;
      }
      case "right": {
        const matrixView = build4x4Matrix(field());
        const shifted = shiftMatrixRight(matrixView, (n) => (deltaScore += n));
        const nextField = flattenMatrix(shifted);
        onMove(nextField);
        break;
      }
      case "left": {
        const matrix = build4x4Matrix(field());
        const rotatedMatrixView = r(r(matrix));
        const shifted = shiftMatrixRight(rotatedMatrixView, (n) => (deltaScore += n));
        const rotatedBack = l(l(shifted));
        const nextField = flattenMatrix(rotatedBack);
        onMove(nextField);
        break;
      }
    }
  }

  onMount(() => {
    setHighscore(+(localStorage.getItem(HIGHSCORE_LOCAL_STORAGE_KEY) ?? "0"));

    const handler = (ev: KeyboardEvent) => {
      switch (ev.key) {
        case "ArrowUp": {
          onInput("up");
          break;
        }
        case "ArrowDown": {
          onInput("down");
          break;
        }
        case "ArrowRight": {
          onInput("right");
          break;
        }
        case "ArrowLeft": {
          onInput("left");
          break;
        }
      }
    };

    document.addEventListener("keydown", handler);

    onCleanup(() => {
      document.removeEventListener("keydown", handler);
    });
  });

  onMount(() => {
    let xDown: number | null = null;
    let yDown: number | null = null;

    function handleTouchStart(ev: TouchEvent) {
      const [touch] = ev.touches;

      if (touch) {
        xDown = touch.clientX;
        yDown = touch.clientY;
      }
    }

    function handleTouchMove(ev: TouchEvent) {
      if (!xDown || !yDown) {
        return;
      }

      const [touch] = ev.touches;

      if (!touch) {
        return;
      }

      const xUp = touch.clientX;
      const yUp = touch.clientY;

      const xDiff = xDown - xUp;
      const yDiff = yDown - yUp;

      if (Math.abs(xDiff) > Math.abs(yDiff)) {
        if (xDiff > 0) {
          onInput("left");
        } else {
          onInput("right");
        }
      } else {
        if (yDiff > 0) {
          onInput("up");
        } else {
          onInput("down");
        }
      }

      // Reset values
      xDown = null;
      yDown = null;
    }

    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("touchmove", handleTouchMove);

    onCleanup(() => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchMove);
    });
  });

  return {
    field,
    hasWon,
    reset,
    score,
    highscore,
  };
}
