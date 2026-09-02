export class InsufficientBalanceError extends Error {
  constructor() {
    super("Insufficient balance");
    this.name = "InsufficientBalanceError";
  }
}

export class InsufficientPositionError extends Error {
  constructor() {
    super("Insufficient position");
    this.name = "InsufficientPositionError";
  }
}

export class OrderNotFoundError extends Error {
  constructor() {
    super("Order not found");
    this.name = "OrderNotFoundError";
  }
}
