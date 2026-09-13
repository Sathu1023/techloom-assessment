package com.techloom.ecommerce.exception;

public class ApiExceptions {

    public static class NotFoundException extends RuntimeException {
        public NotFoundException(String message) { super(message); }
    }

    public static class InsufficientStockException extends RuntimeException {
        public InsufficientStockException(String message) { super(message); }
    }

    public static class InvalidStateTransitionException extends RuntimeException {
        public InvalidStateTransitionException(String message) { super(message); }
    }

    public static class DuplicateRequestException extends RuntimeException {
        public DuplicateRequestException(String message) { super(message); }
    }

    public static class ReservationExpiredException extends RuntimeException {
        public ReservationExpiredException(String message) { super(message); }
    }
}
