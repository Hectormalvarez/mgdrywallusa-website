import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import LeadIntakeForm from '@/components/LeadIntakeForm';
import { MAX_FILES, MAX_FILE_SIZE_BYTES } from '@/lib/leads';

const VALID_URL = 'http://localhost/api/v1/leads/';

function createFile(name: string, sizeBytes: number): File {
  return new File([new ArrayBuffer(sizeBytes)], name, { type: 'image/png' });
}

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Jane Doe' } });
  fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '555-123-4567' } });
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'jane@example.com' } });
  fireEvent.change(screen.getByLabelText(/project/i), { target: { value: 'repair' } });
}

function getHoneypot(): HTMLInputElement {
  return document.querySelector('input[autocomplete="off"][tabindex="-1"]') as HTMLInputElement;
}

describe('LeadIntakeForm — required-field validation', () => {
  it('shows an error when name is missing', async () => {
    render(<LeadIntakeForm apiUrl={VALID_URL} />);
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
  });

  it('shows an error when phone is missing', async () => {
    render(<LeadIntakeForm apiUrl={VALID_URL} />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Jane Doe' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(await screen.findByText(/phone is required/i)).toBeInTheDocument();
  });

  it('shows an error when email is missing', async () => {
    render(<LeadIntakeForm apiUrl={VALID_URL} />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '555-123-4567' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
  });

  it('shows an error when project tier is missing', async () => {
    render(<LeadIntakeForm apiUrl={VALID_URL} />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '555-123-4567' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'jane@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(await screen.findByText(/project tier is required/i)).toBeInTheDocument();
  });

  it('does NOT submit when required fields are missing', async () => {
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
});

describe('LeadIntakeForm — file validation', () => {
  it('shows an error when more than MAX_FILES are selected', async () => {
    render(<LeadIntakeForm apiUrl={VALID_URL} />);
    const files = Array.from({ length: MAX_FILES + 1 }, (_, i) =>
      createFile(`photo${i}.png`, 100),
    );
    const input = screen.getByLabelText(/photo/i) as HTMLInputElement;
    fireEvent.change(input, { target: { files } });

    expect(
      await screen.findByText(new RegExp(`no more than ${MAX_FILES}`, 'i')),
    ).toBeInTheDocument();
  });

  it('shows an error when a file exceeds MAX_FILE_SIZE_BYTES', async () => {
    render(<LeadIntakeForm apiUrl={VALID_URL} />);
    const files = [createFile('huge.png', MAX_FILE_SIZE_BYTES + 1)];
    const input = screen.getByLabelText(/photo/i) as HTMLInputElement;
    fireEvent.change(input, { target: { files } });

    expect(await screen.findByText(/10MB/i)).toBeInTheDocument();
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
    fireEvent.change(screen.getByLabelText(/photo/i), {
      target: { files: [createFile('a.png', 100), createFile('b.png', 100), createFile('c.png', 100), createFile('d.png', 100)] },
    });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await screen.findByText(/no more than/i);
    expect(handlerCalled).toBe(false);
  });
});

describe('LeadIntakeForm — honeypot', () => {
  it('silently aborts submission when the honeypot is filled', async () => {
    let handlerCalled = false;
    server.use(
      http.post('*/api/v1/leads/', () => {
        handlerCalled = true;
        return HttpResponse.json({ id: 1, status: 'created' }, { status: 201 });
      }),
    );

    render(<LeadIntakeForm apiUrl={VALID_URL} />);
    fillRequiredFields();

    const honeypot = getHoneypot();
    expect(honeypot).toBeInTheDocument();
    fireEvent.change(honeypot, { target: { value: 'http://spam.example.com' } });

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await new Promise((r) => setTimeout(r, 100));
    expect(handlerCalled).toBe(false);
    expect(screen.queryByText(/success/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
  });
});

describe('LeadIntakeForm — successful submission', () => {
  it('sends a POST request to the correct endpoint with a FormData body', async () => {
    let requestUrl = '';
    let requestMethod = '';
    let handlerCalled = false;

    server.use(
      http.post('*/api/v1/leads/', async ({ request }) => {
        requestUrl = request.url;
        requestMethod = request.method;
        handlerCalled = true;
        return HttpResponse.json({ id: 1, status: 'created' }, { status: 201 });
      }),
    );

    render(<LeadIntakeForm apiUrl={VALID_URL} />);
    fillRequiredFields();
    fireEvent.change(screen.getByLabelText(/project/i), { target: { value: 'single_room' } });
    fireEvent.change(screen.getByLabelText(/details/i), {
      target: { value: 'Water damage in ceiling' },
    });

    const photo = createFile('damage.png', 500);
    fireEvent.change(screen.getByLabelText(/photo/i), { target: { files: [photo] } });

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument();
    });

    expect(handlerCalled).toBe(true);
    expect(requestMethod).toBe('POST');
    expect(requestUrl).toContain('/api/v1/leads/');
  });

  it('shows a success message after 201 response', async () => {
    render(<LeadIntakeForm apiUrl={VALID_URL} />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument();
    });
  });
});
