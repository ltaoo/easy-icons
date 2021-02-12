import { IconDefinition } from "./types";
export interface HelperRenderOptions {
    placeholders?: {
        primaryColor: string;
        secondaryColor: string;
    };
    extraSVGAttrs?: {
        [key: string]: string;
    };
}
/**
 * 根据？生成 svg 内容
 * @param icond
 * @param options
 */
export declare function renderIconDefinitionToSVGElement(icond: IconDefinition, options?: HelperRenderOptions): string;
