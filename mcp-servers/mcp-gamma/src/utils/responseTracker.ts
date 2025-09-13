import { MCPResponse } from '../types';

type DeepData = {
  data?: DeepData & {
    success?: boolean;
    [key: string]: any;
  };
  success?: boolean;
  [key: string]: any;
};

export interface Response {
  addResponse: (response: MCPResponse) => void;
  getResponses: () => MCPResponse[];
  getSuccessCount: () => number;
  getErrorCount: () => number;
  clear: () => void;
}

export function createResponseTracker(): ResponseTracker {
  const responses: MCPResponse[] = [];

  let successCount = 0;
  let errorCount = 0;

  return {
    addResponse: (response: MCPResponse) => {
      responses.push(response);
      if (response.type === 'error' || response.error || response.result?.error) {
        errorCount++;
        if (typeof debugLog === 'function') {
          debugLog('Response counted as error:', response);
        }
        return;
      }

      if (response.type === 'success') {
        let isSuccess = false;

        const hasError = response.error || response.result?.error;
        if (hasError) {
          errorCount++;
          if (typeof debugLog === 'function') {
            debugLog('Response counted as error (has error property):', response);
          }
          return;
        }

        const drillDown = (obj: any): any => {
          // Check for success flag at this level
          if (obj.success === true) return obj;
          // Drill down into data property if present
          if (obj.data) {
            const deeper = drillDown(obj.data);
            if (deeper && deeper.success === true) return deeper;
          }
          // Keep current object if we found data but no success flag
          return typeof obj.data === 'object' ? obj : null;
        };

        // Check for explicit success flags
        const topLevelSuccess = response.success === true;
        const resultSuccess = response.result?.success === true;

        // Drill down to find deeper success flags or valid data
        const deepData = drillDown(response.result);
        const hasValidData = deepData && typeof deepData === 'object';
        const deepSuccess = deepData?.success === true;

        // Count as success if any level indicates success
        isSuccess = topLevelSuccess || resultSuccess || hasValidData || deepSuccess;

        // Update success counter and log if applicable
        if (isSuccess) {
          successCount++;
          if (typeof debugLog === 'function') {
            debugLog('Response counted as success:', response);
          }
        } else if (typeof debugLog === 'function') {
          debugLog('Response NOT counted as success:', response);
        }
      } else {
        // For ambiguous responses, check if they have any success indicators
        const hasSuccess = response.success || response.result?.success || response.result?.data?.success;
        const hasError = response.error || response.result?.error;
        
        if (hasSuccess && !hasError) {
          successCount++;
          if (typeof debugLog === 'function') {
            debugLog('Ambiguous response counted as success:', response);
          }
        } else {
          errorCount++;
          if (typeof debugLog === 'function') {
            debugLog('Ambiguous response counted as error:', response);
          }
        }
      }
    },
    getResponses: () => responses,
    getSuccessCount: () => successCount,
    getErrorCount: () => errorCount,
    clear: () => {
      responses.length = 0;
      successCount = 0;
      errorCount = 0;
    }
  };
}
