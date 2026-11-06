import { dreamCapRawComponents, applyBlenderLoss, blenderLossFraction, totalUL } from './src/calculators/dreamDustVerified';

// Verify 65g example
const raw = dreamCapRawComponents(65);
console.log('65g raw Dream Cap:');
console.log('  Total µL:', totalUL(raw));

console.log('\nBlender loss fractions:');
console.log('  0 modules:', blenderLossFraction(0), '(35%)');
console.log('  1 module:', blenderLossFraction(1), '(20%)');
console.log('  2 modules:', blenderLossFraction(2), '(10%)');
console.log('  3 modules:', blenderLossFraction(3), '(5%)');
console.log('  4 modules:', blenderLossFraction(4), '(0%)');

const ground4 = applyBlenderLoss(raw, 4);
console.log('\nAfter Blender (4 modules):');
console.log('  Loss fraction:', blenderLossFraction(4));
console.log('  Keep fraction:', 1 - blenderLossFraction(4));
console.log('  Total µL:', totalUL(ground4));
console.log('  Difference:', totalUL(raw) - totalUL(ground4));

const ground3 = applyBlenderLoss(raw, 3);
console.log('\nAfter Blender (3 modules, 5% loss):');
console.log('  Total µL:', totalUL(ground3));
console.log('  Loss µL:', totalUL(raw) - totalUL(ground3));

// Verify 32.5g reference double
const ref = dreamCapRawComponents(32.5);
console.log('\n32.5g reference total:', totalUL(ref));
console.log('Double (should be 65g):', totalUL(ref) * 2);
console.log('Actual 65g:', totalUL(raw));
console.log('Match:', totalUL(ref) * 2 === totalUL(raw));
