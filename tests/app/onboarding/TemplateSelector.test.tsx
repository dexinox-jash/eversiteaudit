import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import TemplateSelector from '@app/onboarding/TemplateSelector';
import type { Template } from '@/types/domain';

describe('TemplateSelector', () => {
  const mockTemplates: Template[] = [
    {
      id: 'tpl-1',
      name: 'Safety Inspection',
      description: 'Standard safety checklist',
      type: 'project_structure',
      content: '{}',
      isDefault: 1,
      usageCount: 5,
      createdAt: 1000,
      updatedAt: 2000,
      isDeleted: 0,
      deletedAt: null,
    },
    {
      id: 'tpl-2',
      name: 'Quality Check',
      description: null,
      type: 'issue_categories',
      content: '{}',
      isDefault: 0,
      usageCount: 3,
      createdAt: 1500,
      updatedAt: 2500,
      isDeleted: 0,
      deletedAt: null,
    },
  ];

  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state', () => {
    render(
      <TemplateSelector
        templates={[]}
        selectedTemplateId={null}
        isLoading={true}
        onSelect={mockOnSelect}
      />
    );
    expect(screen.getByLabelText('Loading')).toBeTruthy();
  });

  it('renders template buttons', () => {
    render(
      <TemplateSelector
        templates={mockTemplates}
        selectedTemplateId={null}
        isLoading={false}
        onSelect={mockOnSelect}
      />
    );
    expect(screen.getByText('Safety Inspection')).toBeTruthy();
    expect(screen.getByText('Quality Check')).toBeTruthy();
  });

  it('calls onSelect when a template is pressed', () => {
    render(
      <TemplateSelector
        templates={mockTemplates}
        selectedTemplateId={null}
        isLoading={false}
        onSelect={mockOnSelect}
      />
    );
    fireEvent.press(screen.getByText('Safety Inspection'));
    expect(mockOnSelect).toHaveBeenCalledWith('tpl-1');
  });

  it('shows description when template is selected', () => {
    render(
      <TemplateSelector
        templates={mockTemplates}
        selectedTemplateId="tpl-1"
        isLoading={false}
        onSelect={mockOnSelect}
      />
    );
    expect(screen.getByText('Standard safety checklist')).toBeTruthy();
  });

  it('shows empty description when selected template has no description', () => {
    render(
      <TemplateSelector
        templates={mockTemplates}
        selectedTemplateId="tpl-2"
        isLoading={false}
        onSelect={mockOnSelect}
      />
    );
    expect(screen.queryByText('Standard safety checklist')).toBeNull();
  });

  it('does not show description when no template is selected', () => {
    render(
      <TemplateSelector
        templates={mockTemplates}
        selectedTemplateId={null}
        isLoading={false}
        onSelect={mockOnSelect}
      />
    );
    expect(screen.queryByText('Standard safety checklist')).toBeNull();
  });

  it('does not show description when templates array is empty', () => {
    render(
      <TemplateSelector
        templates={[]}
        selectedTemplateId="tpl-1"
        isLoading={false}
        onSelect={mockOnSelect}
      />
    );
    expect(screen.queryByText('Standard safety checklist')).toBeNull();
  });
});
