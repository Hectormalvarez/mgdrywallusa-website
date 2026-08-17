import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { http, HttpResponse } from 'msw';
import { axeCheck } from '@/lib/test-utils/axe-helper';
import { server } from '@/mocks/server';
import LeadIntakeForm from '@/components/LeadIntakeForm';
import { MAX_FILES, MAX_FILE_SIZE_BYTES, MAX_TOTAL_SIZE_BYTES } from '@/lib/leads';

const VALID_URL = 'http://localhost/api/v1/leads/';

// jsdom does not implement scrollIntoView
beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

function createFile(name: string, sizeBytes: number, type = 'image/png'): File {
  return new File([new ArrayBuffer(sizeBytes)], name, { type });
}

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText(/^name/i), { target: { value: 'Jane Doe' } });
  fireEvent.change(screen.getByLabelText(/^phone/i), { target: { value: '555-123-4567' } });
  fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: 'jane@example.com' } });
  fireEvent.change(screen.getByLabelText(/^project tier/i), { target: { value: 'repair' } });
}

// ---------------------------------------------------------------------------
// Submit validation
// ---------------------------------------------------------------------------

describe('LeadIntakeForm — submit validation', () => {
  it('shows name error on empty submit', async () => {
    render(<LeadIntakeForm apiUrl={VALID_URL} />);
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
  });

  it('shows phone error when phone is missing', async () => {
    render(<LeadIntakeForm apiUrl={VALID_URL} />);
    fireEvent.change(screen.getByLabelText(/^name/i), { target: { value: 'Jane' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(await screen.findByText(/phone is required/i)).toBeInTheDocument();
  });

  it('shows email error when email is missing', async () => {
    render(<LeadIntakeForm apiUrl={VALID_URL} />);
    fireEvent.change(screen.getByLabelText(/^name/i), { target: { value: 'Jane' } });
    fireEvent.change(screen.getByLabelText(/^phone/i), { target: { value: '555-1234' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
  });

  it('shows project tier error when tier is missing', async () => {
    render(<LeadIntakeForm apiUrl={VALID_URL} />);
    fireEvent.change(screen.getByLabelText(/^name/i), { target: { value: 'Jane' } });
    fireEvent.change(screen.getByLabelText(/^phone/i), { target: { value: '555-1234' } });
    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: 'j@e.co' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(await screen.findByText(/project tier is required/i)).toBeInTheDocument();
  });

  it('does NOT POST when fields are missing', async () => {
    let handlerCalled = false;
    server.use(
      http.post('*/api/v1/leads/', () => {
        handlerCalled = true;
        return HttpResponse.json({ id: 1, status: 'created' }, { status: 201 });
      }),
    );
    render(<LeadIntakeForm apiUrl={VALID_URL} />);
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    await screen.findByText(/name is required/i);
    expect(handlerCalled).toBe(false);
  });

  it('focuses the first invalid field on submit', async () => {
    render(<LeadIntakeForm apiUrl={VALID_URL} />);
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByLabelText(/^name/i));
    });
  });
});

// ---------------------------------------------------------------------------
// Blur / change validation (real-time)
// ---------------------------------------------------------------------------

describe('LeadIntakeForm — blur validation', () => {
  it('shows name error on blur when empty', async () => {
    render(<LeadIntakeForm apiUrl={VALID_URL} />);
    const input = screen.getByLabelText(/^name/i);
    fireEvent.blur(input);
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
  });

  it('shows phone error on blur with empty string', async () => {
    render(<LeadIntakeForm apiUrl={VALID_URL} />);
    const input = screen.getByLabelText(/^phone/i);
    fireEvent.blur(input);
    expect(await screen.findByText(/phone is required/i)).toBeInTheDocument();
  });

  it('shows email error on blur with invalid email', async () => {
    render(<LeadIntakeForm apiUrl={VALID_URL} />);
    const input = screen.getByLabelText(/^email/i);
    fireEvent.change(input, { target: { value: 'bad' } });
    fireEvent.blur(input);
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
  });

  it('clears phone error when valid value is entered', async () => {
    render(<LeadIntakeForm apiUrl={VALID_URL} />);
    const input = screen.getByLabelText(/^phone/i);
    // Show error first
    fireEvent.change(input, { target: { value: 'abc' } });
    fireEvent.blur(input);
    expect(await screen.findByText(/phone is required/i)).toBeInTheDocument();
    // Fix it
    fireEvent.change(input, { target: { value: '555-1234' } });
    fireEvent.blur(input);
    await waitFor(() => {
      expect(screen.queryByText(/valid us phone/i)).not.toBeInTheDocument();
    });
  });

  it('validates project tier on change', async () => {
    render(<LeadIntakeForm apiUrl={VALID_URL} />);
    const select = screen.getByLabelText(/^project tier/i);
    // Select valid tier — no error
    fireEvent.change(select, { target: { value: 'repair' } });
    expect(screen.queryByText(/project tier is required/i)).not.toBeInTheDocument();
    // Select back to empty
    fireEvent.change(select, { target: { value: '' } });
    expect(await screen.findByText(/project tier is required/i)).toBeInTheDocument();
  });

  it('formats phone number with dashes on blur', async () => {
    render(<LeadIntakeForm apiUrl={VALID_URL} />);
    const phoneInput = screen.getByLabelText(/^phone/i);
    fireEvent.change(phoneInput, { target: { value: '5551234567' } });
    fireEvent.blur(phoneInput);
    await waitFor(() => {
      expect(phoneInput).toHaveValue('555-123-4567');
    });
  });
});

// ---------------------------------------------------------------------------
// File validation
// ---------------------------------------------------------------------------

describe('LeadIntakeForm — file validation', () => {
  it('shows error when more than MAX_FILES are selected', async () => {
    render(<LeadIntakeForm apiUrl={VALID_URL} />);
    const tooMany = Array.from({ length: MAX_FILES + 1 }, (_, i) =>
      createFile(`p${i}.png`, 100)
    );
    fireEvent.change(screen.getByLabelText(/photo/i), { target: { files: tooMany } });
    expect(await screen.findByText(/no more than/i)).toBeInTheDocument();
  });

  it('shows error when a file exceeds MAX_FILE_SIZE_BYTES', async () => {
    render(<LeadIntakeForm apiUrl={VALID_URL} />);
    const big = [createFile('huge.png', MAX_FILE_SIZE_BYTES + 1)];
    fireEvent.change(screen.getByLabelText(/photo/i), { target: { files: big } });
    expect(await screen.findByText(/exceeds the 10 MB limit/i)).toBeInTheDocument();
  });

  it('shows error when aggregate size exceeds MAX_TOTAL_SIZE_BYTES', async () => {
    render(<LeadIntakeForm apiUrl={VALID_URL} />);
    const half = Math.floor(MAX_TOTAL_SIZE_BYTES / 2) + 1;
    const files = [createFile('a.png', half), createFile('b.png', half)];
    fireEvent.change(screen.getByLabelText(/photo/i), { target: { files } });
    expect(await screen.findByText(/total upload size exceeds 10 MB/i)).toBeInTheDocument();
  });

  it('shows error for disallowed MIME type (PDF)', async () => {
    render(<LeadIntakeForm apiUrl={VALID_URL} />);
    const pdf = [createFile('doc.pdf', 100, 'application/pdf')];
    fireEvent.change(screen.getByLabelText(/photo/i), { target: { files: pdf } });
    expect(await screen.findByText(/not an accepted file type/i)).toBeInTheDocument();
  });

  it('does NOT submit when file validation fails', async () => {
    let handlerCalled = false;
    server.use(
      http.post('*/api/v1/leads/', () => {
        handlerCalled = true;
        return HttpResponse.json({ id: 1, status: 'created' }, { status: 201 });
      }),
    );
    render(<LeadIntakeForm apiUrl={VALID_URL} />);
    fillRequiredFields();
    const tooMany = Array.from({ length: MAX_FILES + 1 }, (_, i) =>
      createFile(`p${i}.png`, 100)
    );
    fireEvent.change(screen.getByLabelText(/photo/i), { target: { files: tooMany } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(handlerCalled).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ARIA attributes
// ---------------------------------------------------------------------------

describe('LeadIntakeForm — ARIA', () => {
  it('sets aria-invalid on name field when error is present', async () => {
    render(<LeadIntakeForm apiUrl={VALID_URL} />);
    const input = screen.getByLabelText(/^name/i);
    expect(input).toHaveAttribute('aria-invalid', 'false');
    fireEvent.blur(input);
    await waitFor(() => {
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });

  it('links aria-describedby to the error message', async () => {
    render(<LeadIntakeForm apiUrl={VALID_URL} />);
    fireEvent.blur(screen.getByLabelText(/^name/i));
    await waitFor(() => {
      const input = screen.getByLabelText(/^name/i);
      expect(input).toHaveAttribute('aria-describedby', 'lead-name-error');
    });
  });

  it('error message has role="alert"', async () => {
    render(<LeadIntakeForm apiUrl={VALID_URL} />);
    fireEvent.blur(screen.getByLabelText(/^name/i));
    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
  });
});

describe('LeadIntakeForm — accessibility', () => {
  it('has no accessibility violations in default state', async () => {
    const { container } = render(<LeadIntakeForm apiUrl={VALID_URL} />);
    expect(await axeCheck(container)).toHaveNoViolations();
  });

  it('has no accessibility violations when validation errors are visible', async () => {
    const { container } = render(<LeadIntakeForm apiUrl={VALID_URL} />);
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    await screen.findByText(/name is required/i);
    expect(await axeCheck(container)).toHaveNoViolations();
  });

  it('marks all required fields with aria-invalid after submit', async () => {
    render(<LeadIntakeForm apiUrl={VALID_URL} />);
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/^name/i)).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByLabelText(/^phone/i)).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByLabelText(/^email/i)).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByLabelText(/^project tier/i)).toHaveAttribute('aria-invalid', 'true');
    });
  });

  it('associates each invalid field with its error via aria-describedby', async () => {
    render(<LeadIntakeForm apiUrl={VALID_URL} />);
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/^name/i)).toHaveAttribute('aria-describedby', 'lead-name-error');
      expect(screen.getByLabelText(/^phone/i)).toHaveAttribute('aria-describedby', 'lead-phone-error');
      expect(screen.getByLabelText(/^email/i)).toHaveAttribute('aria-describedby', 'lead-email-error');
      expect(screen.getByLabelText(/^project tier/i)).toHaveAttribute('aria-describedby', 'lead-project-error');
    });
  });

  it('exposes each field error with role="alert"', async () => {
    render(<LeadIntakeForm apiUrl={VALID_URL} />);
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    const alerts = await screen.findAllByRole('alert');
    expect(alerts.length).toBeGreaterThanOrEqual(4);
  });
});

// ---------------------------------------------------------------------------
// Honeypot
// ---------------------------------------------------------------------------

describe('LeadIntakeForm — honeypot', () => {
  it('renders a hidden honeypot input', () => {
    render(<LeadIntakeForm apiUrl={VALID_URL} />);
    const honeypot = document.querySelector('input[name="company"]') as HTMLInputElement;
    expect(honeypot).toBeInTheDocument();
    expect(honeypot.getAttribute('tabindex')).toBe('-1');
    expect(honeypot.getAttribute('autocomplete')).toBe('off');
  });

  it('silently aborts submission when honeypot is filled', async () => {
    let handlerCalled = false;
    server.use(
      http.post('*/api/v1/leads/', () => {
        handlerCalled = true;
        return HttpResponse.json({ id: 1, status: 'created' }, { status: 201 });
      }),
    );
    render(<LeadIntakeForm apiUrl={VALID_URL} />);
    fillRequiredFields();
    const honeypot = document.querySelector('input[name="company"]') as HTMLInputElement;
    fireEvent.change(honeypot, { target: { value: 'bot' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    await new Promise((r) => setTimeout(r, 150));
    expect(handlerCalled).toBe(false);
    expect(screen.queryByText(/success/i)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Server error paths
// ---------------------------------------------------------------------------

describe('LeadIntakeForm — server error handling', () => {
  it('displays field-level errors on 422 from backend', async () => {
    server.use(
      http.post('*/api/v1/leads/', () => {
        return HttpResponse.json(
          {
            errors: {
              phone: ['Enter a valid phone number.'],
              email: ['Enter a valid email address.'],
            },
          },
          { status: 422 },
        );
      }),
    );

    render(<LeadIntakeForm apiUrl={VALID_URL} />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/enter a valid phone number/i)).toBeInTheDocument();
      expect(screen.getByText(/enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('displays generic error when backend returns 500 without field errors', async () => {
    server.use(
      http.post('*/api/v1/leads/', () => {
        return HttpResponse.json({ detail: 'Internal Server Error' }, { status: 500 });
      }),
    );

    render(<LeadIntakeForm apiUrl={VALID_URL} />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/submission failed/i)).toBeInTheDocument();
    });
  });
});

describe('LeadIntakeForm — successful submission', () => {
  it('sends POST with FormData and shows success', async () => {
    let handlerCalled = false;
    let requestMethod = '';
    server.use(
      http.post('*/api/v1/leads/', async ({ request }) => {
        handlerCalled = true;
        requestMethod = request.method;
        return HttpResponse.json({ id: 1, status: 'created' }, { status: 201 });
      }),
    );
    render(<LeadIntakeForm apiUrl={VALID_URL} />);
    fillRequiredFields();
    fireEvent.change(screen.getByLabelText(/^project tier/i), { target: { value: 'single_room' } });
    fireEvent.change(screen.getByLabelText(/^details/i), { target: { value: 'Ceiling repair' } });
    fireEvent.change(screen.getByLabelText(/photo/i), {
      target: { files: [createFile('img.png', 500)] },
    });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    await waitFor(() => {
      expect(screen.getByText(/thank you/i)).toBeInTheDocument();
    });
    expect(handlerCalled).toBe(true);
    expect(requestMethod).toBe('POST');
  });

  it('shows success after valid submit without photos', async () => {
    render(<LeadIntakeForm apiUrl={VALID_URL} />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    await waitFor(() => {
      expect(screen.getByText(/thank you/i)).toBeInTheDocument();
    });
  });
});
