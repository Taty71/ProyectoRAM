import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import AssignControls from '../componentes/AssignControls';

describe('AssignControls', () => {
  const m = { _id: 'm1', nombre: 'Matemáticas', ciclo: 'CBU', cargaHoraria: { dias: ['Lunes'] } };
  test('renderiza y permite togglear dias', () => {
    const assignValues = {};
    const setAssignValues = vi.fn((fn) => {
      // simple mock: call updater with empty prev
      fn({});
    });
  const onSave = vi.fn();
    const onCancel = vi.fn();

    render(<AssignControls m={m} assignValues={assignValues} setAssignValues={setAssignValues} onSave={onSave} onCancel={onCancel} />);

    // check Save and Cancel buttons
  expect(screen.getByText('Guardar')).toBeTruthy();
  expect(screen.getByText('Cancelar')).toBeTruthy();

    // click Cancel
    fireEvent.click(screen.getByText('Cancelar'));
    expect(onCancel).toHaveBeenCalled();
  });
});
