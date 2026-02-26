import { describe, it, expect } from 'vitest';
import { expandTemplate, TEMPLATES } from '../../src/lib/templates.js';

describe('Templates Module', () => {
  describe('expandTemplate', () => {
    it('should replace simple variable {product}', () => {
      const { prompt } = expandTemplate('product-photo', 'product=leather sofa');
      expect(prompt).toContain('leather sofa');
    });

    it('should expand product-photo template', () => {
      const { prompt } = expandTemplate('product-photo', 'product=camera');
      expect(prompt).toContain('camera');
      expect(prompt).toContain('Professional product photography');
    });

    it('should expand social-post template with multiple variables', () => {
      const { prompt } = expandTemplate('social-post', 'subject=sunset,mood=peaceful');
      expect(prompt).toContain('sunset');
      expect(prompt).toContain('peaceful');
    });

    it('should expand portrait template', () => {
      const { prompt } = expandTemplate(
        'portrait',
        'subject=woman,style=fashion,lighting=soft',
      );
      expect(prompt).toContain('woman');
      expect(prompt).toContain('fashion');
      expect(prompt).toContain('soft');
    });

    it('should expand landscape template', () => {
      const { prompt } = expandTemplate(
        'landscape',
        'scene=mountains,time_of_day=sunrise,weather=clear',
      );
      expect(prompt).toContain('mountains');
      expect(prompt).toContain('sunrise');
      expect(prompt).toContain('clear');
    });

    it('should expand hero-image template', () => {
      const { prompt } = expandTemplate('hero-image', 'subject=tech,style=minimal');
      expect(prompt).toContain('tech');
      expect(prompt).toContain('minimal');
    });

    it('should expand logo template', () => {
      const { prompt } = expandTemplate('logo', 'brand=MyApp,style=geometric');
      expect(prompt).toContain('MyApp');
      expect(prompt).toContain('geometric');
    });

    it('should expand icon-set template', () => {
      const { prompt } = expandTemplate('icon-set', 'style=outline,subject=travel');
      expect(prompt).toContain('outline');
      expect(prompt).toContain('travel');
    });

    it('should handle template with no variables', () => {
      const { prompt, warnings } = expandTemplate('product-photo', '');
      expect(prompt).toContain('{product}');
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('product');
    });

    it('should return warnings for unreplaced placeholders', () => {
      const { warnings } = expandTemplate('portrait', 'subject=man');
      expect(warnings).toContain('Template variable {style} was not provided');
      expect(warnings).toContain('Template variable {lighting} was not provided');
    });

    it('should ignore extra variables', () => {
      const { prompt, warnings } = expandTemplate(
        'product-photo',
        'product=laptop,extra=unused,another=value',
      );
      expect(prompt).toContain('laptop');
      expect(warnings).toHaveLength(0);
    });

    it('should handle variables with spaces', () => {
      const { prompt } = expandTemplate('product-photo', 'product=luxury leather sofa');
      expect(prompt).toContain('luxury leather sofa');
    });

    it('should handle variables with special characters', () => {
      const { prompt } = expandTemplate('product-photo', 'product=design (2024)');
      expect(prompt).toContain('design (2024)');
    });

    it('should not replace partial matches', () => {
      const { prompt, warnings } = expandTemplate('logo', 'brand=MyApp,brandname=Unused');
      expect(prompt).toContain('MyApp');
      expect(prompt).toContain('{style}');
      expect(warnings).toContain('Template variable {style} was not provided');
    });

    it('should parse comma-separated variables correctly', () => {
      const { prompt } = expandTemplate(
        'social-post',
        'subject=beach,mood=relaxed',
      );
      expect(prompt).toContain('beach');
      expect(prompt).toContain('relaxed');
    });

    it('should handle variables with equals in value', () => {
      const { prompt } = expandTemplate('product-photo', 'product=equation=x+y');
      expect(prompt).toContain('equation=x+y');
    });

    it('should handle empty values', () => {
      const { prompt, warnings } = expandTemplate('product-photo', 'product=');
      // Empty value will set varsMap['product'] = '', which replaces {product} with empty string
      expect(prompt).not.toContain('{product}');
      expect(warnings).toHaveLength(0);
    });

    it('should trim whitespace around key and value', () => {
      const { prompt } = expandTemplate('product-photo', '  product  =  camera  ');
      expect(prompt).toContain('camera');
    });

    it('should throw for unknown template name', () => {
      expect(() => expandTemplate('unknown-template', 'foo=bar')).toThrow(
        /Unknown template "unknown-template"/,
      );
    });

    it('should throw with list of available templates', () => {
      expect(() => expandTemplate('fake', '')).toThrow(/Available:/);
    });
  });

  describe('Built-in templates', () => {
    it('should have product-photo template', () => {
      expect(TEMPLATES).toHaveProperty('product-photo');
    });

    it('should have social-post template', () => {
      expect(TEMPLATES).toHaveProperty('social-post');
    });

    it('should have portrait template', () => {
      expect(TEMPLATES).toHaveProperty('portrait');
    });

    it('should have landscape template', () => {
      expect(TEMPLATES).toHaveProperty('landscape');
    });

    it('should have hero-image template', () => {
      expect(TEMPLATES).toHaveProperty('hero-image');
    });

    it('should have logo template', () => {
      expect(TEMPLATES).toHaveProperty('logo');
    });

    it('should have icon-set template', () => {
      expect(TEMPLATES).toHaveProperty('icon-set');
    });

    it('product-photo should contain {product} placeholder', () => {
      expect(TEMPLATES['product-photo']).toContain('{product}');
    });

    it('all templates should be non-empty strings', () => {
      for (const template of Object.values(TEMPLATES)) {
        expect(typeof template).toBe('string');
        expect(template.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle multiple instances of same variable', () => {
      // Create a scenario with repeated variable if template has it
      const { prompt } = expandTemplate('product-photo', 'product=widget');
      const matches = (prompt.match(/widget/g) || []).length;
      expect(matches).toBeGreaterThan(0);
    });

    it('should handle case-sensitive variable names', () => {
      const { prompt, warnings } = expandTemplate(
        'product-photo',
        'Product=camera,product=device',
      );
      // Should use lowercase 'product'
      expect(prompt).toContain('device');
    });

    it('should preserve template structure when no variables provided', () => {
      const { prompt } = expandTemplate('product-photo', '');
      expect(prompt).toContain('Professional product photography');
      expect(prompt).toContain('{product}');
    });
  });
});
