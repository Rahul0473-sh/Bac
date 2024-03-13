class ApiError extends Error {
    constructor(
      statuscode, message = "something Went Wrong", errors = [])
    {
      
    super(message);// overwrite
    this.statuscode = statuscode;
    this.data = null;
    this.message = message;
    this.sucess = false;
    this.errors = errors;
  }
}
export default ApiError 