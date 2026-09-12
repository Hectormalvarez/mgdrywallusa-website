import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axeCheck } from '@tests/utils/axe-helper';
import FilterMultiSelect from '@/components/ui/FilterMultiSelect';

const OPTIONS = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
];

describe('FilterMultiSelect', () => {
  it('renders nothing when there are no options', () => {
    const { container } = render(
      <FilterMultiSelect
        label="Project type"
        options={[]}
        selected={[]}
        onChange={() => {}}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the label with an "All" summary while collapsed', () => {
    render(
      <FilterMultiSelect
        label="Project type"
        options={OPTIONS}
        selected={[]}
        onChange={() => {}}
      />
    );

    expect(screen.getByText('Project type')).toBeVisible();
    expect(screen.getByText('All')).toBeVisible();

    const trigger = screen.getByRole('button', { name: /project type/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    // Options are hidden until the trigger is activated.
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('opens the checkbox panel when the trigger is clicked', () => {
    render(
      <FilterMultiSelect
        label="Project type"
        options={OPTIONS}
        selected={[]}
        onChange={() => {}}
      />
    );

    const trigger = screen.getByRole('button', { name: /project type/i });
    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('checkbox', { name: 'Residential' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Commercial' })).toBeInTheDocument();
  });

  it('adds a value when an unselected option is checked', () => {
    const onChange = jest.fn();
    render(
      <FilterMultiSelect
        label="Project type"
        options={OPTIONS}
        selected={['residential']}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /project type/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Commercial' }));

    expect(onChange).toHaveBeenCalledWith(['residential', 'commercial']);
  });

  it('removes a value when a selected option is unchecked', () => {
    const onChange = jest.fn();
    render(
      <FilterMultiSelect
        label="Project type"
        options={OPTIONS}
        selected={['residential', 'commercial']}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /project type/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Residential' }));

    expect(onChange).toHaveBeenCalledWith(['commercial']);
  });

  it('summarises a single selection with its label', () => {
    render(
      <FilterMultiSelect
        label="Project type"
        options={OPTIONS}
        selected={['commercial']}
        onChange={() => {}}
      />
    );

    expect(screen.getByText('Commercial')).toBeVisible();
  });

  it('summarises multiple selections with a count', () => {
    render(
      <FilterMultiSelect
        label="Project type"
        options={OPTIONS}
        selected={['residential', 'commercial']}
        onChange={() => {}}
      />
    );

    expect(screen.getByText('2 selected')).toBeVisible();
  });

  it('closes on Escape and returns focus to the trigger', () => {
    render(
      <FilterMultiSelect
        label="Project type"
        options={OPTIONS}
        selected={[]}
        onChange={() => {}}
      />
    );

    const trigger = screen.getByRole('button', { name: /project type/i });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();
  });

  it('closes when clicking outside the control', () => {
    render(
      <FilterMultiSelect
        label="Project type"
        options={OPTIONS}
        selected={[]}
        onChange={() => {}}
      />
    );

    const trigger = screen.getByRole('button', { name: /project type/i });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    fireEvent.mouseDown(document.body);

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('has no accessibility violations when open with a selection', async () => {
    const { container } = render(
      <FilterMultiSelect
        label="Project type"
        options={OPTIONS}
        selected={['commercial']}
        onChange={() => {}}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /project type/i }));

    expect(await axeCheck(container)).toHaveNoViolations();
  });

  it("anchors the panel to the trigger's left edge by default", () => {
    render(
      <FilterMultiSelect
        label="Project type"
        options={OPTIONS}
        selected={[]}
        onChange={() => {}}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /project type/i }));

    const panel = screen.getByRole('group', { name: 'Project type' });
    expect(panel).toHaveClass('left-0');
    expect(panel).not.toHaveClass('right-0');
  });

  it('anchors the panel to the right edge when used near the container edge', () => {
    render(
      <FilterMultiSelect
        label="Finish"
        options={OPTIONS}
        selected={[]}
        onChange={() => {}}
        align="right"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /finish/i }));

    const panel = screen.getByRole('group', { name: 'Finish' });
    expect(panel).toHaveClass('right-0');
    expect(panel).not.toHaveClass('left-0');
  });
});
