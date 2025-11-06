import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';

export default [
    ...baseConfig,
    ...nx.configs['flat/react'],
    {
        files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
        // Override or add rules here
        rules: {
            // Treat React Compiler ref access warnings as warnings, not errors
            'react-hooks/refs': 'warn',
            'react-hooks/set-state-in-effect': 'warn',
            'react-hooks/preserve-manual-memoization': 'warn',
            // Allow empty catch blocks with comments
            'no-empty': ['error', { allowEmptyCatch: true }],
            // Disable React Compiler's impure function check - it's too strict
            'react-compiler/react-compiler': 'off',
        },
    }
];
