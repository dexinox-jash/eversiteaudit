import React from 'react';
import { Alert } from 'react-native';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react-native';
import { router } from 'expo-router';
import TemplatesScreen from '@app/templates/index';
import { templateRepository } from '@services/db/repositories';
import {
  createCustomTemplate,
  editCustomTemplate,
  deleteCustomTemplate,
} from '@services/template/templateService';
import { hapticSuccess, hapticError } from '@services/os/haptics';

jest.mock('@services/db/repositories', () => ({
  templateRepository: {
    getByType: jest.fn(),
  },
}));

jest.mock('@services/template/templateService', () => ({
  createCustomTemplate: jest.fn(),
  editCustomTemplate: jest.fn(),
  deleteCustomTemplate: jest.fn(),
  parseTemplateContent: jest.fn((content: string) => {
    try {
      const parsed = JSON.parse(content) as unknown;
      if (
        parsed &&
        typeof parsed === 'object' &&
        'sections' in parsed &&
        Array.isArray((parsed as { sections: unknown }).sections)
      ) {
        return {
          sections: (parsed as { sections: unknown[] }).sections.filter(
            (s): s is string => typeof s === 'string'
          ),
        };
      }
    } catch {
      // fall through
    }
    return { sections: [] };
  }),
}));

jest.mock('@services/os/haptics', () => ({
  hapticSuccess: jest.fn(),
  hapticError: jest.fn(),
  hapticImpact: jest.fn(),
}));

const builtInTemplate = {
  id: 'tmpl-default-1',
  type: 'project_structure',
  name: 'Default Safety',
  description: 'System template',
  content: '{}',
  isDefault: 1,
  createdAt: 1000,
  updatedAt: 1000,
  isDeleted: 0,
  deletedAt: null,
};

const customTemplate = {
  id: 'custom-abc',
  type: 'project_structure',
  name: 'My Custom',
  description: 'User made',
  content: '{}',
  isDefault: 0,
  createdAt: 2000,
  updatedAt: 2000,
  isDeleted: 0,
  deletedAt: null,
};

describe('TemplatesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (templateRepository.getByType as jest.Mock).mockResolvedValue([
      builtInTemplate,
      customTemplate,
    ]);
  });

  it('loads and renders the list of templates', async () => {
    render(<TemplatesScreen />);

    await waitFor(() => {
      expect(screen.getByText('Default Safety')).toBeTruthy();
    });
    expect(screen.getByText('My Custom')).toBeTruthy();
    expect(screen.getByText('Built-in')).toBeTruthy();
  });

  it('shows loading state initially', () => {
    (templateRepository.getByType as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(<TemplatesScreen />);
    expect(screen.getAllByLabelText('Loading').length).toBeGreaterThan(0);
  });

  it('shows empty state when no templates exist', async () => {
    (templateRepository.getByType as jest.Mock).mockResolvedValue([]);
    render(<TemplatesScreen />);

    await waitFor(() => {
      expect(screen.getByText('No templates found.')).toBeTruthy();
    });
  });

  it('does not show edit or delete buttons for built-in templates', async () => {
    render(<TemplatesScreen />);

    await waitFor(() => {
      expect(screen.getByText('Default Safety')).toBeTruthy();
    });

    expect(screen.queryByLabelText('Edit template Default Safety')).toBeNull();
    expect(screen.queryByLabelText('Delete template Default Safety')).toBeNull();
    expect(screen.getByLabelText('Edit template My Custom')).toBeTruthy();
    expect(screen.getByLabelText('Delete template My Custom')).toBeTruthy();
  });

  it('opens the create modal when the button is pressed', async () => {
    render(<TemplatesScreen />);

    await waitFor(() => {
      expect(screen.getByText('My Custom')).toBeTruthy();
    });

    fireEvent.press(screen.getByLabelText('Create custom template'));

    await waitFor(() => {
      expect(screen.getByText('New Template')).toBeTruthy();
    });
  });

  it('validates required name field', async () => {
    render(<TemplatesScreen />);

    await waitFor(() => {
      expect(screen.getByText('My Custom')).toBeTruthy();
    });

    fireEvent.press(screen.getByLabelText('Create custom template'));
    await waitFor(() => expect(screen.getByText('New Template')).toBeTruthy());

    fireEvent.press(screen.getByText('Save'));

    await waitFor(() => {
      expect(screen.getByText('Template name is required')).toBeTruthy();
    });
    expect(createCustomTemplate).not.toHaveBeenCalled();
  });

  it('creates a custom template on save', async () => {
    (createCustomTemplate as jest.Mock).mockResolvedValue(customTemplate);
    render(<TemplatesScreen />);

    await waitFor(() => expect(screen.getByText('My Custom')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('Create custom template'));
    await waitFor(() => expect(screen.getByText('New Template')).toBeTruthy());

    fireEvent.changeText(screen.getByPlaceholderText('Template name'), 'New T');
    fireEvent.changeText(
      screen.getByPlaceholderText('e.g. Safety, Quality, Compliance'),
      'Safety, Quality'
    );

    await act(async () => {
      fireEvent.press(screen.getByText('Save'));
    });

    await waitFor(() => {
      expect(createCustomTemplate).toHaveBeenCalledWith('New T', null, ['Safety', 'Quality']);
    });
    expect(hapticSuccess).toHaveBeenCalled();
  });

  it('fires haptic error when create fails', async () => {
    (createCustomTemplate as jest.Mock).mockRejectedValue(new Error('fail'));
    render(<TemplatesScreen />);

    await waitFor(() => expect(screen.getByText('My Custom')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('Create custom template'));
    await waitFor(() => expect(screen.getByText('New Template')).toBeTruthy());

    fireEvent.changeText(screen.getByPlaceholderText('Template name'), 'Bad');
    await act(async () => {
      fireEvent.press(screen.getByText('Save'));
    });

    await waitFor(() => {
      expect(hapticError).toHaveBeenCalled();
    });
  });

  it('deletes a custom template', async () => {
    (deleteCustomTemplate as jest.Mock).mockResolvedValue(undefined);
    (jest.spyOn(Alert, 'alert') as unknown as jest.Mock).mockImplementation((_title: string, _message: string | undefined, buttons?: Array<{ style?: string; text?: string; onPress?: () => void }>) => {
      buttons?.find((b) => b.style === 'destructive')?.onPress?.();
    });
    render(<TemplatesScreen />);

    await waitFor(() => expect(screen.getByText('My Custom')).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Delete template My Custom'));
    });

    await waitFor(() => {
      expect(deleteCustomTemplate).toHaveBeenCalledWith('custom-abc');
    });
    expect(hapticSuccess).toHaveBeenCalled();
  });

  it('fires haptic error when delete fails', async () => {
    (deleteCustomTemplate as jest.Mock).mockRejectedValue(new Error('fail'));
    (jest.spyOn(Alert, 'alert') as unknown as jest.Mock).mockImplementation((_title: string, _message: string | undefined, buttons?: Array<{ style?: string; text?: string; onPress?: () => void }>) => {
      buttons?.find((b) => b.style === 'destructive')?.onPress?.();
    });
    render(<TemplatesScreen />);

    await waitFor(() => expect(screen.getByText('My Custom')).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Delete template My Custom'));
    });

    await waitFor(() => {
      expect(hapticError).toHaveBeenCalled();
    });
  });

  it('closes modal with the close button', async () => {
    render(<TemplatesScreen />);

    await waitFor(() => expect(screen.getByText('My Custom')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('Create custom template'));
    await waitFor(() => expect(screen.getByText('New Template')).toBeTruthy());

    fireEvent.press(screen.getByLabelText('Close modal'));

    await waitFor(() => {
      expect(screen.queryByText('New Template')).toBeNull();
    });
  });

  it('closes modal with the cancel button', async () => {
    render(<TemplatesScreen />);

    await waitFor(() => expect(screen.getByText('My Custom')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('Create custom template'));
    await waitFor(() => expect(screen.getByText('New Template')).toBeTruthy());

    fireEvent.press(screen.getByText('Cancel'));

    await waitFor(() => {
      expect(screen.queryByText('New Template')).toBeNull();
    });
  });

  it('opens edit modal with pre-populated fields', async () => {
    render(<TemplatesScreen />);

    await waitFor(() => expect(screen.getByText('My Custom')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('Edit template My Custom'));

    await waitFor(() => {
      expect(screen.getByText('Edit Template')).toBeTruthy();
    });

    const nameInput = screen.getByDisplayValue('My Custom');
    expect(nameInput).toBeTruthy();
  });

  it('updates a custom template on save', async () => {
    (editCustomTemplate as jest.Mock).mockResolvedValue({ ...customTemplate, name: 'Updated' });
    render(<TemplatesScreen />);

    await waitFor(() => expect(screen.getByText('My Custom')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('Edit template My Custom'));
    await waitFor(() => expect(screen.getByText('Edit Template')).toBeTruthy());

    fireEvent.changeText(screen.getByDisplayValue('My Custom'), 'Updated Name');

    await act(async () => {
      fireEvent.press(screen.getByText('Update'));
    });

    await waitFor(() => {
      expect(editCustomTemplate).toHaveBeenCalledWith(
        'custom-abc',
        'Updated Name',
        'User made',
        []
      );
    });
    expect(hapticSuccess).toHaveBeenCalled();
  });

  it('fires haptic error when edit fails', async () => {
    (editCustomTemplate as jest.Mock).mockRejectedValue(new Error('fail'));
    render(<TemplatesScreen />);

    await waitFor(() => expect(screen.getByText('My Custom')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('Edit template My Custom'));
    await waitFor(() => expect(screen.getByText('Edit Template')).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByText('Update'));
    });

    await waitFor(() => {
      expect(hapticError).toHaveBeenCalled();
    });
  });

  it('navigates back when the back button is pressed', async () => {
    render(<TemplatesScreen />);

    await waitFor(() => expect(screen.getByText('My Custom')).toBeTruthy());

    fireEvent.press(screen.getByLabelText('Go back'));
    expect(router.back).toHaveBeenCalled();
  });
});
