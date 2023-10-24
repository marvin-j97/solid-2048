export type Matrix<T> = T[][];

export function build4x4Matrix<T>(arr: T[]): Matrix<T> {
  return [
    [arr[0]!, arr[1]!, arr[2]!, arr[3]!],
    [arr[4]!, arr[5]!, arr[6]!, arr[7]!],
    [arr[8]!, arr[9]!, arr[10]!, arr[11]!],
    [arr[12]!, arr[13]!, arr[14]!, arr[15]!],
  ];
}

export function flattenMatrix<T>(matrix: Matrix<T>): T[] {
  return matrix.flat();
}

export function shallowCopyMatrix<T>(matrix: Matrix<T>): Matrix<T> {
  const copiedMatrix = matrix.map((row) => [...row]);
  return copiedMatrix as Matrix<T>;
}

export function rotateMatrixRight<T>(matrix: Matrix<T>): Matrix<T> {
  const copy = shallowCopyMatrix(matrix);
  const N = matrix.length;

  matrix.forEach((row, i) => {
    row.forEach((value, j) => {
      copy[j]![N - 1 - i] = value;
    });
  });

  return copy as Matrix<T>;
}

export function rotateMatrixLeft<T>(matrix: Matrix<T>): Matrix<T> {
  const copy = shallowCopyMatrix(matrix);
  const N = matrix.length;

  matrix.forEach((row, i) => {
    row.forEach((value, j) => {
      copy[N - 1 - j]![i] = value;
    });
  });

  return copy as Matrix<T>;
}
