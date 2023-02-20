import { css } from '../vendor/fast-element.min.js';
import {
  themeConditional,
  scrollBarSize,
  paletteGrayLight3,
  paletteGrayDark4,
  paletteGrayDark2,
  paletteGrayLight2,
  fontSizeHeading3,
  lineHeightHeading3,
  fontWeightHeading3,
  fontWeightBody1,
  lineHeightBody1,
  fontSizeBody1,
  bodyFont,
  paletteBlack,
  paletteGrayDark1,
  paletteGrayBase,
  paletteGrayLight1,
  spacing1,
  spacing4,
  spacing3,
  spacing2,
  spacing5,
  spacing6,
  spacing7,
  monospaceFont,
  fontSizeCode1,
  lineHeightCode1,
  fontWeightCode1,
  fontSizeHeading6,
  fontWeightHeading6,
  lineHeightHeading6,
  fontSizeHeading5,
  lineHeightHeading5,
  fontWeightHeading5,
  linkColor, paletteWhite, paletteGrayDark3
} from './design-tokens.js'

export const normalize = () => css`
  *:not(:defined) {
    visibility: hidden;
  }

  *:focus,
  *:focus-visible {
    outline: none;
  }

  *,
  *:before,
  *:after {
    box-sizing: border-box;
  }

  [hidden] {
    display: none !important;
  }

  h1,
  h2,
  h3,
  h6,
  p,
  small,
  label {
    margin: unset;
  }

  :-webkit-any-link {
    color: currentColor;
  }

  :-moz-any-link {
    color: currentColor;
  }

  :any-link {
    color: currentColor;
  }
`;

export const scrollbars = (selector = '') => css`
  ${selector}::-webkit-scrollbar {
    width: calc(${scrollBarSize} * 1px);
    height: calc(${scrollBarSize} * 1px);
  }

  ${selector}::-webkit-scrollbar-track {
    background-color: ${themeConditional(paletteGrayLight3, paletteGrayDark4)};
  }

  ${selector}::-webkit-scrollbar-thumb {
    background-color: ${themeConditional(paletteGrayLight2, paletteGrayDark2)};
  }

  :host {
    scrollbar-color: ${themeConditional(paletteGrayLight3, paletteGrayDark4)}
      ${themeConditional(paletteGrayLight2, paletteGrayDark2)};
    scrollbar-width: thin;
  }
`;

[
  scrollBarSize,
  themeConditional(paletteGrayLight3, paletteGrayDark4),
  themeConditional(paletteGrayLight2, paletteGrayDark2)
].forEach((dt) => {
  document.body.style.setProperty(dt.cssCustomProperty, dt.$value);
});

scrollbars('body').addStylesTo(document.body);

export const ellipsis = () => css.partial`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

export const hotkey = () => css`
  .hotkey {
    user-select: none;
    cursor: pointer;
    font-family: ${monospaceFont};
    border: 1px solid ${themeConditional(paletteGrayDark3, paletteGrayBase)};
    border-radius: 3px;
    padding-left: 5px;
    padding-right: 5px;
    color: ${themeConditional(paletteBlack, paletteGrayLight2)};
    background-color: ${themeConditional(paletteWhite, paletteGrayDark3)};
    font-size: ${fontSizeCode1};
    line-height: ${lineHeightCode1};
  }

  .hotkey:hover {
    background-color: ${themeConditional(paletteGrayLight2, paletteGrayDark2)};
  }
`;

export const emptyState = () => css`
  .empty-state {
    display: flex;
    word-wrap: break-word;
    align-items: center;
    flex-direction: column;
    flex-flow: column;
    justify-content: center;
    min-height: 260px;
    padding: 40px 0 0;
  }

  .empty-state .picture svg {
    height: 100px;
    margin: 50px 0;
  }

  .empty-state h3 {
    font-weight: bold;
    margin-bottom: 20px;
  }

  .empty-state p {
    width: 400px;
    margin-bottom: 42px;
    text-align: center;
    font-size: calc(${fontSizeBody1} + 2px);
    color: ${themeConditional(paletteGrayDark1, paletteGrayLight1)};
  }

  .empty-state ppp-button.large {
    margin: 24px 0;
  }
`;

export const spacing = () => css`
  .spacing1 {
    margin-top: ${spacing1};
  }

  .spacing2 {
    margin-top: ${spacing2};
  }

  .spacing3 {
    margin-top: ${spacing3};
  }

  .spacing4 {
    margin-top: ${spacing4};
  }

  .spacing5 {
    margin-top: ${spacing5};
  }

  .spacing6 {
    margin-top: ${spacing6};
  }

  .spacing7 {
    margin-top: ${spacing7};
  }
`;

export const typography = () => css`
  h3 {
    font-size: ${fontSizeHeading3};
    line-height: ${lineHeightHeading3};
    font-weight: ${fontWeightHeading3};
    color: ${themeConditional(paletteBlack, paletteGrayLight2)};
  }

  h5 {
    font-size: ${fontSizeHeading5};
    line-height: ${lineHeightHeading5};
    font-weight: ${fontWeightHeading5};
    color: ${themeConditional(paletteBlack, paletteGrayLight2)};
  }

  h6 {
    font-size: ${fontSizeHeading6};
    line-height: ${lineHeightHeading6};
    font-weight: ${fontWeightHeading6};
    color: ${themeConditional(paletteBlack, paletteGrayLight2)};
  }

  .body1 {
    font-size: ${fontSizeBody1};
    line-height: ${lineHeightBody1};
    font-weight: ${fontWeightBody1};
  }

  .code1 {
    font-family: ${monospaceFont};
    font-size: ${fontSizeCode1};
    line-height: ${lineHeightCode1};
    font-weight: ${fontWeightCode1};
    white-space: nowrap;
  }

  .link {
    font-family: ${bodyFont};
    display: inline-flex;
    align-items: center;
    text-decoration: none;
    cursor: pointer;
    line-height: 13px;
    color: ${linkColor};
    font-weight: ${fontWeightBody1};
  }

  .link:focus {
    outline: none;
  }

  .label {
    font-size: ${fontSizeBody1};
    line-height: ${lineHeightBody1};
    font-family: ${bodyFont};
    font-weight: bold;
    color: ${themeConditional(paletteBlack, paletteGrayLight2)};
  }

  .label[disabled] {
    color: ${themeConditional(paletteGrayDark1, paletteGrayBase)};
  }

  .description {
    margin-top: 0;
    margin-bottom: 0;
    font-family: ${bodyFont};
    font-size: ${fontSizeBody1};
    line-height: ${lineHeightBody1};
    font-weight: normal;
    color: ${themeConditional(paletteGrayDark1, paletteGrayLight1)};
  }

  .description[disabled] {
    color: ${themeConditional(paletteGrayDark1, paletteGrayBase)};
  }
`;
