import { LeadFormSchema, ChatMessageSchema } from '@/lib/security/validation';

describe('Validation Schemas', () => {
  it('should validate valid lead form', () => {
    const validLead = {
      name: 'John Doe',
      phone: '9876543210',
      email: 'john@example.com',
      budget: '50-75 Lakhs',
      location: 'Gomti Nagar',
    };

    const result = LeadFormSchema.safeParse(validLead);
    expect(result.success).toBe(true);
  });

  it('should reject invalid phone', () => {
    const invalidLead = {
      name: 'John Doe',
      phone: '123', // Too short
    };

    const result = LeadFormSchema.safeParse(invalidLead);
    expect(result.success).toBe(false);
  });

  it('should validate chat message', () => {
    const validMessage = {
      content: 'Tell me about properties in Gomti Nagar',
    };

    const result = ChatMessageSchema.safeParse(validMessage);
    expect(result.success).toBe(true);
  });

  it('should reject empty message', () => {
    const invalidMessage = {
      content: '',
    };

    const result = ChatMessageSchema.safeParse(invalidMessage);
    expect(result.success).toBe(false);
  });
});
