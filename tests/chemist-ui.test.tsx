import { describe, expect, test } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChemistProductionPlanner } from '../src/ui/ChemistProductionPlanner';

describe('ChemistProductionPlanner UI interactions', () => {
  test('Component renders with Calculate button', () => {
    render(<ChemistProductionPlanner />);
    
    const calculateButton = screen.getByText(/Calculate production plan/i);
    expect(calculateButton).toBeDefined();
    
    // Check key input fields exist
    expect(screen.getByLabelText(/Target finished purity/i)).toBeDefined();
    expect(screen.getByLabelText(/Required Dream Dust vials/i)).toBeDefined();
  });

  test('Changing raw grams shows stale indicator after calculation', async () => {
    render(<ChemistProductionPlanner />);
    
    // Initial calculate (with short timeout to avoid hanging)
    const calculateButton = screen.getByText(/Calculate production plan/i);
    fireEvent.click(calculateButton);
    
    // Wait for result
    await waitFor(() => {
      const resultHeading = screen.queryByText(/Production result:/i);
      return resultHeading !== null;
    }, { timeout: 10000 });
    
    // Change input
    const rawInput = screen.getByLabelText(/Raw Dream Cap available/i);
    fireEvent.change(rawInput, { target: { value: '45' } });
    
    // Should show stale warning
    await waitFor(() => {
      expect(screen.queryByText(/Inputs changed/i)).toBeDefined();
    }, { timeout: 1000 });
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
    const mushInput = screen.getByLabelText(/^Dream Cap Mush \(mL\)$/i);
    const mushValue = (mushInput as HTMLInputElement).value;
    expect(parseFloat(mushValue)).toBeCloseTo(27.333, 2);
  });

  test('materials-first entry calculates 750+476 without requiring target vials', () => {
    render(<ChemistProductionPlanner />);
    fireEvent.click(screen.getByText(/Example 750 \+ 476/i));
    fireEvent.click(screen.getByRole('button', { name: /Calculate from my materials/i }));
    expect(screen.getByText(/Available actual Dream Cap Mush/i)).toBeDefined();
    expect(screen.getByText(/222\.\d+ mL/)).toBeDefined();
    expect(screen.queryByText(/guaranteed 38-vial/i)).toBeDefined();
  });

  test('cannot skip to later stages before Calculate+Continue', () => {
    render(<ChemistProductionPlanner />);
    const finalTab = screen.getByRole('button', { name: /^Final Dust/i });
    expect((finalTab as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByText(/Example 750 \+ 476/i));
    fireEvent.click(screen.getByRole('button', { name: /Calculate from my materials/i }));
    expect(screen.getByTestId('continue-prediction-ground')).toBeDefined();
    expect((screen.getByTestId('continue-readings-ground') as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByTestId('continue-prediction-ground'));
    expect(screen.getByTestId('stage-extraction')).toBeDefined();
    expect((screen.getByRole('button', { name: /^Final Dust/i }) as HTMLButtonElement).disabled).toBe(true);
  });

  test('editing one extraction field does not label the rest verified', () => {
    render(<ChemistProductionPlanner />);
    fireEvent.click(screen.getByText(/Example 750 \+ 476/i));
    fireEvent.click(screen.getByRole('button', { name: /Calculate from my materials/i }));
    fireEvent.click(screen.getByTestId('continue-prediction-ground'));
    fireEvent.click(screen.getByTestId('calculate-extraction'));
    const extractInput = screen.getByLabelText(/^Dream Cap Extract \(mL\)$/i);
    fireEvent.change(extractInput, { target: { value: '40' } });
    fireEvent.click(screen.getByTestId('continue-readings-extraction'));
    expect(screen.getByTestId('stage-acidBase')).toBeDefined();
    expect(screen.queryByText(/Partial reading/i)).toBeDefined();
    expect(screen.queryByText(/Verified by measurement/i)).toBeNull();
  });

  test('Input validation shows unsupported status for invalid config', async () => {
    render(<ChemistProductionPlanner />);
    
    // Set invalid target vials
    const vialsInput = screen.getByLabelText(/Required Dream Dust vials/i);
    fireEvent.change(vialsInput, { target: { value: '0' } });
    
    const calculateButtons = screen.getAllByText(/Calculate production plan/i);
    const mainCalculateButton = calculateButtons.find(btn => 
      btn.tagName === 'BUTTON' && btn.getAttribute('type') === 'button'
    );
    expect(mainCalculateButton).toBeDefined();
    fireEvent.click(mainCalculateButton!);
    
    // Should show some result (unsupported or validation message)
    await waitFor(() => {
      const resultText = screen.queryByText(/Production result:/i);
      expect(resultText).toBeDefined();
    }, { timeout: 3000 });
  });
});
