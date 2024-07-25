import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';

/** @type {import('eslint').Linter.Config[]} */
export default [
	pluginJs.configs.recommended,
	...tseslint.configs.recommended,
	{
		files: ['**/*.{js,mjs,cjs,ts}'],
	},
	{
		languageOptions: { globals: globals.browser },
	},
	{
		ignores: ['dist/*', 'coverage/*', 'node_modules/*'],
	},
	{
		plugins: {
			'@stylistic': stylistic,
		},
		rules: {
			// Logical linter rules for JS
			'no-alert': 'warn',
			'no-console': ['warn', { 'allow': ['warn', 'error'] }],
			'no-debugger': 'warn',
			'prefer-const': 'warn',

			// Logical linter rules for TS
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-non-null-assertion': 'off',
			'@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],

			// Stylistic/formatting rules for both JS and TS
			'@stylistic/comma-dangle': ['warn', 'always-multiline'],
			'@stylistic/comma-spacing': 'warn',
			'@stylistic/indent': ['warn', 'tab', { 'MemberExpression': 2, 'CallExpression': { 'arguments': 2 }, 'ignoredNodes': ['TemplateLiteral'], 'SwitchCase': 1 }],
			'@stylistic/key-spacing': ['warn', { 'mode': 'strict' }],
			'@stylistic/keyword-spacing': 'warn',
			'@stylistic/semi': ['warn', 'always'],
			'@stylistic/space-before-function-paren': ['warn', { 'anonymous': 'never', 'named': 'never', 'asyncArrow': 'always' }],
			'@stylistic/space-before-blocks': 'warn',
			'@stylistic/object-curly-spacing': ['warn', 'always'],
			'@stylistic/quotes': ['warn', 'single', { avoidEscape: true }],

			// Stylistic/formatting rules for JS
			'@stylistic/arrow-spacing': 'warn',
			'@stylistic/max-len': 'off',
			'@stylistic/no-trailing-spaces': 'warn',
			'@stylistic/no-multiple-empty-lines': ['warn', { 'max': 1 }],
			'@stylistic/operator-linebreak': ['warn', 'after'],
			'@stylistic/template-curly-spacing': 'off',

			// Stylistic/formatting rules for TS
			'@stylistic/member-delimiter-style': 'warn',
			'@stylistic/type-annotation-spacing': 'warn',
		},
	},
];
