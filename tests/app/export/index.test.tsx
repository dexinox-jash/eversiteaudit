import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react-native';
import { useLocalSearchParams, router } from 'expo-router';
import ExportScreen from '@app/export/index';
import { exportProjectToPDF } from '@services/export/pdfExport';
import { exportProjectToZIP } from '@services/export/zipExport';
import { exportProjectToJSON } from '@services/export/jsonExport';
import { exportProjectToCSV } from '@services/export/csvExport';
import { shareFile } from '@services/export/shareExport';
import { hapticSuccess, hapticError } from '@services/os/haptics';

jest.mock('@services/export/pdfExport');
jest.mock('@services/export/zipExport');
jest.mock('@services/export/jsonExport');
jest.mock('@services/export/csvExport');
jest.mock('@services/export/shareExport');
jest.mock('@services/os/haptics');
jest.mock('expo-file-system', () => ({
  deleteAsync: jest.fn().mockResolvedValue(undefined),
}));
const mockPreferenceStore = {
  lastPdfReportTemplate: 'template-1' as string | null,
  setLastPdfReportTemplate: jest.fn(),
};

jest.mock('@store/usePreferenceStore', () => ({
  __esModule: true,
  usePreferenceStore: jest.fn(() => mockPreferenceStore),
}));

describe('ExportScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    (exportProjectToPDF as jest.Mock).mockResolvedValue({
      filePath: 'file:///mock/export.pdf',
      fileSize: 1234,
      checksum: 'abc',
      mimeType: 'application/pdf',
    });
    (exportProjectToZIP as jest.Mock).mockResolvedValue({
      filePath: 'file:///mock/export.zip',
      fileSize: 5678,
      checksum: 'def',
      mimeType: 'application/zip',
    });
    (exportProjectToJSON as jest.Mock).mockResolvedValue({
      filePath: 'file:///mock/export.json',
      fileSize: 900,
      checksum: 'ghi',
      mimeType: 'application/json',
    });
    (exportProjectToCSV as jest.Mock).mockResolvedValue({
      filePath: 'file:///mock/export.csv',
      fileSize: 450,
      checksum: 'jkl',
      mimeType: 'text/csv',
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders Preparing initially for non-PDF format', () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({
      projectId: 'proj-1',
      format: 'zip',
    });

    render(<ExportScreen />);
    expect(screen.getByText('Preparing export...')).toBeTruthy();
  });

  it('shows exporting progress for PDF format', async () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({
      projectId: 'proj-1',
      format: 'pdf',
    });

    render(<ExportScreen />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.getByText('PDF Report')).toBeTruthy();
    });

    await waitFor(() => {
      expect(exportProjectToPDF).toHaveBeenCalledWith(
        'proj-1',
        undefined,
        expect.objectContaining({
          companyName: null,
          headerText: null,
          footerText: null,
        }),
        'template-1',
        expect.any(Function)
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Export Complete')).toBeTruthy();
    });
    expect(hapticSuccess).toHaveBeenCalled();
  });

  it('shows exporting progress for ZIP format', async () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({
      projectId: 'proj-1',
      format: 'zip',
    });

    render(<ExportScreen />);
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(exportProjectToZIP).toHaveBeenCalledWith('proj-1', undefined, expect.any(Function));
    });

    await waitFor(() => {
      expect(screen.getByText('Export Complete')).toBeTruthy();
    });
  });

  it('shows exporting progress for JSON format', async () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({
      projectId: 'proj-1',
      format: 'json',
    });

    render(<ExportScreen />);
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(exportProjectToJSON).toHaveBeenCalledWith('proj-1', undefined, expect.any(Function));
    });

    await waitFor(() => {
      expect(screen.getByText('Export Complete')).toBeTruthy();
    });
  });

  it('shows exporting progress for CSV format', async () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({
      projectId: 'proj-1',
      format: 'csv',
    });

    render(<ExportScreen />);
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(exportProjectToCSV).toHaveBeenCalledWith('proj-1', undefined, expect.any(Function));
    });

    await waitFor(() => {
      expect(screen.getByText('Export Complete')).toBeTruthy();
    });
  });

  it('calls share action when Share File is pressed', async () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({
      projectId: 'proj-1',
      format: 'pdf',
    });

    render(<ExportScreen />);
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.getByText('Export Complete')).toBeTruthy();
    });

    fireEvent.press(screen.getByLabelText('Share exported file'));
    expect(shareFile).toHaveBeenCalledWith(
      expect.objectContaining({ filePath: 'file:///mock/export.pdf' })
    );
  });

  it('shows error state when export fails', async () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({
      projectId: 'proj-1',
      format: 'pdf',
    });
    (exportProjectToPDF as jest.Mock).mockRejectedValue(new Error('PDF generation failed'));

    render(<ExportScreen />);
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.getByText('Export Failed')).toBeTruthy();
      expect(screen.getByText('PDF generation failed')).toBeTruthy();
    });
    expect(hapticError).toHaveBeenCalled();
  });

  it('retries export when Try Again is pressed after failure', async () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({
      projectId: 'proj-1',
      format: 'pdf',
    });
    (exportProjectToPDF as jest.Mock)
      .mockRejectedValueOnce(new Error('transient failure'))
      .mockResolvedValueOnce({
        filePath: 'file:///mock/retry.pdf',
        fileSize: 100,
        checksum: 'x',
        mimeType: 'application/pdf',
      });

    render(<ExportScreen />);
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => expect(screen.getByText('Export Failed')).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Try export again'));
    });

    await waitFor(() => {
      expect(screen.getByText('Export Complete')).toBeTruthy();
    });
    expect(exportProjectToPDF).toHaveBeenCalledTimes(2);
  });

  it('cancels export and goes back when Cancel is pressed in preparing state', () => {
    mockPreferenceStore.lastPdfReportTemplate = null;
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({
      projectId: 'proj-1',
      format: 'pdf',
    });

    render(<ExportScreen />);
    fireEvent.press(screen.getByLabelText('Cancel export'));
    expect(router.back).toHaveBeenCalled();
    mockPreferenceStore.lastPdfReportTemplate = 'template-1';
  });

  it('shows format label based on query param', () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({
      projectId: 'proj-1',
      format: 'csv',
    });

    render(<ExportScreen />);
    expect(screen.getByText('CSV Spreadsheet')).toBeTruthy();
  });

  it('shows template picker for PDF when no last template is set', () => {
    mockPreferenceStore.lastPdfReportTemplate = null;
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({
      projectId: 'proj-1',
      format: 'pdf',
    });

    render(<ExportScreen />);
    expect(screen.getByText('Choose Report Template')).toBeTruthy();
    mockPreferenceStore.lastPdfReportTemplate = 'template-1';
  });

  it('renders all 8 built-in report template options in picker', () => {
    mockPreferenceStore.lastPdfReportTemplate = null;
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({
      projectId: 'proj-1',
      format: 'pdf',
    });

    render(<ExportScreen />);
    expect(screen.getByLabelText(/Select template Executive Summary/)).toBeTruthy();
    expect(screen.getByLabelText(/Select template Detailed Technical/)).toBeTruthy();
    expect(screen.getByLabelText(/Select template Photo-First/)).toBeTruthy();
    expect(screen.getByLabelText(/Select template Checklist/)).toBeTruthy();
    expect(screen.getByLabelText(/Select template Timeline/)).toBeTruthy();
    expect(screen.getByLabelText(/Select template Severity Matrix/)).toBeTruthy();
    expect(screen.getByLabelText(/Select template Location-Based/)).toBeTruthy();
    expect(screen.getByLabelText(/Select template Custom/)).toBeTruthy();
    mockPreferenceStore.lastPdfReportTemplate = 'template-1';
  });

  it('persists chosen template and starts export when a template is picked', async () => {
    mockPreferenceStore.lastPdfReportTemplate = null;
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({
      projectId: 'proj-1',
      format: 'pdf',
    });

    render(<ExportScreen />);
    await act(async () => {
      fireEvent.press(screen.getByLabelText(/Select template Executive Summary/));
    });

    expect(mockPreferenceStore.setLastPdfReportTemplate).toHaveBeenCalledWith('executive-summary');

    await waitFor(() => {
      expect(exportProjectToPDF).toHaveBeenCalledWith(
        'proj-1',
        undefined,
        expect.any(Object),
        'executive-summary',
        expect.any(Function)
      );
    });

    mockPreferenceStore.lastPdfReportTemplate = 'template-1';
  });

  it('forwards branding params when provided', async () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({
      projectId: 'proj-1',
      format: 'pdf',
      companyName: 'Acme Corp',
      headerText: 'Header',
      footerText: 'Footer',
    });

    render(<ExportScreen />);
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(exportProjectToPDF).toHaveBeenCalledWith(
        'proj-1',
        undefined,
        expect.objectContaining({
          companyName: 'Acme Corp',
          headerText: 'Header',
          footerText: 'Footer',
        }),
        'template-1',
        expect.any(Function)
      );
    });
  });

  it('navigates back when Done is pressed after export', async () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({
      projectId: 'proj-1',
      format: 'zip',
    });

    render(<ExportScreen />);
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => expect(screen.getByText('Export Complete')).toBeTruthy());

    fireEvent.press(screen.getByLabelText('Done'));
    expect(router.back).toHaveBeenCalled();
  });

  it('updates progress as handleProgress is invoked', async () => {
    const progressCalls: Array<(n: number) => void> = [];
    (exportProjectToZIP as jest.Mock).mockImplementation(
      async (_id: string, _pw: unknown, onProgress: (n: number) => void, _signal?: AbortSignal) => {
        progressCalls.push(onProgress);
        onProgress(40);
        return {
          filePath: 'file:///mock/progress.zip',
          fileSize: 100,
          checksum: 'c',
          mimeType: 'application/zip',
        };
      }
    );

    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({
      projectId: 'proj-1',
      format: 'zip',
    });

    render(<ExportScreen />);
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => expect(progressCalls.length).toBe(1));
    await waitFor(() => expect(screen.getByText('Export Complete')).toBeTruthy());
  });

  it('allows cancelling an in-progress export', async () => {
    (exportProjectToJSON as jest.Mock).mockImplementation(
      async (_id: string, _pw: unknown, _onProgress: (n: number) => void, signal?: AbortSignal) => {
        return new Promise((_resolve, reject) => {
          const check = (): void => {
            if (signal?.aborted) {
              reject(new Error('Export aborted'));
              return;
            }
            setTimeout(check, 10);
          };
          check();
        });
      }
    );

    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({
      projectId: 'proj-1',
      format: 'json',
    });

    render(<ExportScreen />);
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => expect(screen.getByLabelText('Cancel export')).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Cancel export'));
    });

    await waitFor(() => expect(screen.getByText('Export Cancelled')).toBeTruthy());
  });

  it('passes abort signal to export services', async () => {
    (useLocalSearchParams as unknown as jest.Mock).mockReturnValue({
      projectId: 'proj-1',
      format: 'csv',
    });

    render(<ExportScreen />);
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(exportProjectToCSV).toHaveBeenCalledWith(
        'proj-1',
        undefined,
        expect.any(Function),
        expect.any(AbortSignal)
      );
    });
  });
});
