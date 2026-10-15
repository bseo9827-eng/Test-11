declare module '@lhncbc/ucum-lhc' {
  export interface ConvertResult {
    status: 'succeeded' | 'failed' | 'error';
    toVal: number | null;
    msg: string[];
    code?: string;
  }
  export interface ValidateResult {
    status: 'valid' | 'invalid' | 'error';
    ucumCode: string | null;
    msg: string[];
  }
  export class UcumLhcUtils {
    static getInstance(): UcumLhcUtils;
    validateUnitString(u: string, suggest?: boolean): ValidateResult;
    convertUnitTo(
      from: string,
      val: number,
      to: string,
      opts?: { molecularWeight?: number; charge?: number },
    ): ConvertResult;
  }
}
