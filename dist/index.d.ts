import { Plugin } from 'vite';
import { Options } from './types';
declare const oxlintPlugin: (options?: Options) => Plugin;
export default oxlintPlugin;
