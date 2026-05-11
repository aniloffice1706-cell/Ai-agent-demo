import { sanitizeInput, sanitizeFile } from '@/lib/security/rateLimiter';
import { sanitizeHtml } from '@/lib/security/auth';

describe('Security Utils', () => {
  it('should sanitize input', () => {
    const input = '<script>alert("xss")</script>Hello World';
    const sanitized = sanitizeInput(input);
    expect(sanitized).not.toContain('<script>');
  });

  it('should sanitize filename', () => {
    const filename = '<dangerous>file.pdf';
    const sanitized = sanitizeFile(filename);
    expect(sanitized).not.toContain('<');
    expect(sanitized).not.toContain('>');
  });

  it('should sanitize HTML', () => {
    const html = '<img src=x onerror="alert(1)">';
    const sanitized = sanitizeHtml(html);
    expect(sanitized).not.toContain('onerror');
  });
});
