const { Converter, Scanner, Unoconv } = require('../src/index');
const path = require('path');
const fs = require('fs-extra');

// Mock fs-extra and child_process to avoid side effects
jest.mock('fs-extra');
jest.mock('child_process');

describe('Library Exports', () => {
  test('should export Converter class', () => {
    expect(Converter).toBeDefined();
  });

  test('should export Scanner class', () => {
    expect(Scanner).toBeDefined();
  });

  test('should export Unoconv class', () => {
    expect(Unoconv).toBeDefined();
  });
});

describe('Scanner', () => {
  test('should initialize with default extensions', () => {
    const scanner = new Scanner();
    expect(scanner.extensions).toContain('.docx');
    expect(scanner.extensions).toContain('.pptx');
  });

  test('should detect supported files', () => {
    const scanner = new Scanner();
    expect(scanner.isSupported('test.docx')).toBe(true);
    expect(scanner.isSupported('test.txt')).toBe(true);
    expect(scanner.isSupported('test.exe')).toBe(false);
  });
});

describe('Converter', () => {
  let converter;

  beforeEach(() => {
    converter = new Converter();
  });

  test('should initialize with default options', () => {
    expect(converter.outputFormat).toBe('pdf');
    expect(converter.outputDir).toBe('./output');
  });

  test('should update options via constructor', () => {
    const customConverter = new Converter({ outputFormat: 'jpg', outputDir: './images' });
    expect(customConverter.outputFormat).toBe('jpg');
    expect(customConverter.outputDir).toBe('./images');
  });
});
