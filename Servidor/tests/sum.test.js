function sum(a, b) {
  return a + b;
}

test('suma 2 + 3 es igual a 5', () => {
  expect(sum(2, 3)).toBe(5);
});
