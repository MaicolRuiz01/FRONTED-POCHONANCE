export interface Transaction {
  uid: number;
  counterpartyId: number;
  orderId: string;
  note: string;
  orderType: string;
  transactionId: string;
  transactionTime: number;
  amount: string;
  currency: string;
  walletType: number;
  walletTypes: number[];
  payerInfo: {
    binanceId?: number;
    unmaskData: boolean;
    name?: string;
    email?: string;
    accountId?: number;
  };
  receiverInfo: {
    name?: string;
    type?: string;
    email?: string;
    accountId?: number;
    binanceId?: number;
    unmaskData: boolean;
    extend?: {
      phoneOrEmailChanged: boolean;
    };
  };
  totalPaymentFee: string;

  // Derivados
  fromAccount?: string;
  toAccount?: string;
}
