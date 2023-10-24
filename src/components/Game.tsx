import { createEffect, createSignal, For, Show, type JSXElement, onMount, onCleanup } from "solid-js";
import { TransitionGroup } from "solid-transition-group";

type Tile = {
  value: number;
}

const box = (x: number): Tile => ({ value: x })

function spawnRandomTile(arr: Tile[], count = 1): Tile[] {
  const copy = [...arr];

  let created = 0;

  while (created < count) {
    if (copy.every(x => x.value > 0)) {
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
  const field = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0].map(_ => box(0));
  return spawnRandomTile(field, 2);
}

type MatrixRow<T> = [T, T, T, T];
type Matrix<T> = [MatrixRow<T>, MatrixRow<T>, MatrixRow<T>, MatrixRow<T>];

function buildMatrix<T>(arr: T[]): Matrix<T> {
  return [
    [arr[0]!, arr[1]!, arr[2]!, arr[3]!],
    [arr[4]!, arr[5]!, arr[6]!, arr[7]!],
    [arr[8]!, arr[9]!, arr[10]!, arr[11]!],
    [arr[12]!, arr[13]!, arr[14]!, arr[15]!],
  ]
}

function matrixToField<T>(matrix: Matrix<T>): T[] {
  return matrix.flat();
}

function shallowCopyMatrix<T>(matrix: Matrix<T>): Matrix<T> {
  const copiedMatrix = matrix.map((row) => [...row]);
  return copiedMatrix as Matrix<T>;
}

function rotateMatrixRight<T>(matrix: Matrix<T>): Matrix<T> {
  const copy = shallowCopyMatrix(matrix);

  matrix.forEach((row, i) => {
    row.forEach((value, j) => {
      copy[j]![4 - 1 - i] = value;
    });
  });

  return copy as Matrix<T>;
}

function rotateMatrixLeft<T>(matrix: Matrix<T>): Matrix<T> {
  const copy = shallowCopyMatrix(matrix);

  matrix.forEach((row, i) => {
    row.forEach((value, j) => {
      copy[4 - 1 - j]![i] = value;
    });
  });

  return copy as Matrix<T>;
}

function shiftMatrixRight(input: Matrix<Tile>, addScore: (x: number) => void): Matrix<Tile> {
  const matrix = shallowCopyMatrix(input);

  for (let i = 0; i < 4; i++) {
    const row = matrix[i]!;

    // Try to merge
    let canMerge = true;

    for (let j = 2; j >= 0; j--) {
      const currentTile = row[j]!;
      if (currentTile.value === 0) {
        continue;
      }

      let indexToMergeWith = j + 1;
      while (true) {
        if (indexToMergeWith >= 4) {
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
    for (let j = 2; j >= 0; j--) {
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

        if (indexToMoveTo === 3) {
          break;
        }

        if (nextTile.value === 0) {
          indexToMoveTo += 1;
        }
        else {
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

const HIGHSCORE_LOCAL_STORAGE_KEY = "highscore"

export default function Game(): JSXElement {
  const [field, setField] = createSignal(createInitialField());
  const [hasWon, setWin] = createSignal(false);
  const [score, setScore] = createSignal(0);
  const [highscore, setHighscore] = createSignal(0);

  function addScore(points: number): void {
    setScore(x => x + points);

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
    if (field().some(x => x.value === 2_048)) {
      setWin(true);
    }
  });

  function onInput(key: "left" | "right" | "up" | "down"): void {
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
        const matrix = buildMatrix(field());
        const rotatedMatrixView = r(matrix);
        const shifted = shiftMatrixRight(rotatedMatrixView, (n) => deltaScore += n);
        const rotatedBack = l(shifted);
        const nextField = matrixToField(rotatedBack);
        onMove(nextField);
        break;
      }
      case "down": {
        const matrix = buildMatrix(field());
        const rotatedMatrixView = r(r(r(matrix)));
        const shifted = shiftMatrixRight(rotatedMatrixView, (n) => deltaScore += n);
        const rotatedBack = l(l(l(shifted)));
        const nextField = matrixToField(rotatedBack);
        onMove(nextField);
        break;
      }
      case "right": {
        const matrixView = buildMatrix(field());
        const shifted = shiftMatrixRight(matrixView, (n) => deltaScore += n);
        const nextField = matrixToField(shifted);
        onMove(nextField);
        break;
      }
      case "left": {
        const matrix = buildMatrix(field());
        const rotatedMatrixView = r(r(matrix));
        const shifted = shiftMatrixRight(rotatedMatrixView, (n) => deltaScore += n);
        const rotatedBack = l(l(shifted));
        const nextField = matrixToField(rotatedBack);
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
  })

  onMount(() => {
    let xDown: number | null = null;
    let yDown: number | null = null;

    function handleTouchStart(ev: TouchEvent) {
      const [touch] = ev.touches;

      if (touch) {
        xDown = touch.clientX;
        yDown = touch.clientY;
      }
    };

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
          onInput("left")
        } else {
          onInput("right")
        }
      } else {
        if (yDiff > 0) {
          onInput("up")
        } else {
          onInput("down")
        }
      }

      // Reset values
      xDown = null;
      yDown = null;
    };


    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);

    onCleanup(() => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchMove)
    });
  });

  return <div>
    <div class="text-center mb-5">
      <div class="text-lg font-medium text-blue-500 dark:text-blue-300" >Score: {score()}</div>
      <div class="text-lg font-medium text-amber-700 dark:text-amber-300" >Highscore: {highscore()}</div>
    </div>
    <div class="flex justify-center mb-5">
      <button class="bg-blue-500 dark:bg-blue-300 text-white dark:text-black px-3 py-2 rounded" onClick={reset}>Reset</button>
    </div>
    <div
      class="select-none grid grid-cols-4 gap-2 bg-blue-100 dark:bg-blue-950 rounded-lg p-3 max-w-sm mx-auto"
    >
      <TransitionGroup name="group-item">
        <For each={field()} fallback={<div>fallback</div>}>
          {(item) => (
            <>
              <div classList={{
                "bg-blue-200 dark:bg-blue-900": item.value === 0,
                "bg-indigo-300 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-400": item.value === 2,
                "bg-indigo-400 dark:bg-indigo-700 text-indigo-900 dark:text-indigo-300": item.value === 4,
                "bg-violet-300 dark:bg-violet-800 text-violet-800 dark:text-violet-400": item.value === 8,
                "bg-violet-400 dark:bg-violet-700 text-violet-900 dark:text-violet-300": item.value === 16,
                "bg-purple-300 dark:bg-purple-800 text-purple-800 dark:text-violet-400": item.value === 32,
                "bg-purple-400 dark:bg-purple-700 text-purple-900 dark:text-violet-300": item.value === 64,
                "bg-fuchsia-300 dark:bg-fuchsia-800 text-fuchsia-800 dark:text-fuchsia-400": item.value === 128,
                "bg-fuchsia-400 dark:bg-fuchsia-700 text-fuchsia-900 dark:text-fuchsia-400": item.value === 256,
                "bg-pink-300 dark:bg-pink-800 text-pink-800 dark:text-pink-400": item.value === 512,
                "bg-pink-400 dark:bg-pink-700 text-pink-900 dark:text-pink-300": item.value === 1_024,
                "bg-red-500 dark:bg-red-600 text-red-900 dark:text-red-100": item.value === 2_048,
              }} class="group-item rounded text-2xl font-bold flex justify-center items-center w-full aspect-ratio-square">
                <Show when={item.value > 0}>
                  <span>{item.value}</span>
                </Show>
              </div>
            </>
          )}
        </For>
      </TransitionGroup>
    </div>
    <Show when={hasWon()}>
      <div class="text-xl text-blue-500 dark:text-blue-300 font-semibold text-center mt-5">
        You have won!!!
      </div>
    </Show>
  </div>
}
