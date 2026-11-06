import { describe, expect, test } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChemistProductionPlanner } from '../src/ui/ChemistProductionPlanner';

describe('ChemistProductionPlanner UI interactions', () => {
  test('Calculate button updates results when inputs change', async () => {
    render(<ChemistProductionPlanner />);
    
    // Find and click Calculate button
    const calculateButton = screen.getByText(/Calculate production plan/i);
    expect(calculateButton).toBeDefined();
    
    fireEvent.click(calculateButton);
    
    // Should show results section
    await waitFor(() => {
      expect(screen.getByText(/Production result:/i)).toBeDefined();
    });
    
    // Should show feasible with defaults
    await waitFor(() => {
      expect(screen.getByText(/feasible/i)).toBeDefined();
    }, { timeout: 5000 });
  });

  test('Changing raw grams shows stale indicator', async () => {
    render(<ChemistProductionPlanner />);
    
    // Initial calculate
    const calculateButton = screen.getByText(/Calculate production plan/i);
    fireEvent.click(calculateButton);
    
    await waitFor(() => {
      expect(screen.getByText(/feasible/i)).toBeDefined();
    }, { timeout: 5000 });
    
    // Change input
    const rawInput = screen.getByLabelText(/Raw Dream Cap available/i);
    fireEvent.change(rawInput, { target: { value: '45' } });
    
    // Should show stale warning
    await waitFor(() => {
      expect(screen.getByText(/Inputs changed/i)).toBeDefined();
    });
  });

  test('Ground mode quick-fill button calculates from raw', () => {
    render(<ChemistProductionPlanner />);
    
    // Switch to ground mode
    const modeSelect = screen.getByLabelText(/Dream Cap processing state/i);
    fireEvent.change(modeSelect, { target: { value: 'ground' } });
    
    // Find quick-fill section
    const quickFillButton = screen.getByText(/Calculate ground from raw/i);
    expect(quickFillButton).toBeDefined();
    
    // Set raw grams input in quick-fill
    const quickRawInput = screen.getAllByLabelText(/Raw grams/i)[0];
    fireEvent.change(quickRawInput!, { target: { value: '32.5' } });
    
    // Click calculate button
    fireEvent.click(quickFillButton);
    
    // Check that Dream Cap Mush field is populated (should be ~27,333µL = 27.333mL for 32.5g with 4 modules)
    const mushInput = screen.getByLabelText(/Dream Cap Mush/i);
    const mushValue = (mushInput as HTMLInputElement).value;
    expect(parseFloat(mushValue)).toBeCloseTo(27.333, 2);
  });

  test('Input validation shows appropriate errors', async () => {
    render(<ChemistProductionPlanner />);
    
    // Set invalid target vials
    const vialsInput = screen.getByLabelText(/Required Dream Dust vials/i);
    fireEvent.change(vialsInput, { target: { value: '0' } });
    
    const calculateButton = screen.getByText(/Calculate production plan/i);
    fireEvent.click(calculateButton);
    
    // Should show validation error
    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      const hasValidationError = alerts.some(alert => 
        alert.textContent?.includes('positive integer') || 
        alert.textContent?.includes('vials')
      );
      expect(hasValidationError).toBe(true);
    });
  });

  test('Result updates after recalculation', async () => {
    render(<ChemistProductionPlanner />);
    
    // First calculation
    const calculateButton = screen.getByText(/Calculate production plan/i);
    fireEvent.click(calculateButton);
    
    await waitFor(() => {
      expect(screen.getByText(/15 \/ 15 requested vials/i)).toBeDefined();
    }, { timeout: 5000 });
    
    // Change purity target
    const purityInput = screen.getByLabelText(/Target finished purity/i);
    fireEvent.change(purityInput, { target: { value: '90' } });
    
    // Recalculate
    fireEvent.click(calculateButton);
    
    // Should show different result (no-solution for 90%)
    await waitFor(() => {
      expect(screen.getByText(/no-solution/i)).toBeDefined();
    }, { timeout: 5000 });
  });
});
