export const ERRORS = {
  IMPLEMENT: "You must implement '%1' method in classes which extends '%2'.",
};

class ImplementError extends Error {
  constructor(method, context) {
    let message = ERRORS.IMPLEMENT.replace("%1", method).replace("%2", context);
    super(message);
    this.name = self.toString();
  }
}

export default ImplementError;
