package com.techloom.ecommerce.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private ResponseEntity<Object> body(HttpStatus status, String error, String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", status.value());
        body.put("error", error);
        body.put("message", message);
        return ResponseEntity.status(status).body(body);
    }

    @ExceptionHandler(ApiExceptions.NotFoundException.class)
    public ResponseEntity<Object> handleNotFound(ApiExceptions.NotFoundException ex) {
        return body(HttpStatus.NOT_FOUND, "NOT_FOUND", ex.getMessage());
    }

    @ExceptionHandler(ApiExceptions.InsufficientStockException.class)
    public ResponseEntity<Object> handleInsufficientStock(ApiExceptions.InsufficientStockException ex) {
        return body(HttpStatus.CONFLICT, "INSUFFICIENT_STOCK", ex.getMessage());
    }

    @ExceptionHandler(ApiExceptions.InvalidStateTransitionException.class)
    public ResponseEntity<Object> handleInvalidTransition(ApiExceptions.InvalidStateTransitionException ex) {
        return body(HttpStatus.CONFLICT, "INVALID_STATE_TRANSITION", ex.getMessage());
    }

    @ExceptionHandler(ApiExceptions.DuplicateRequestException.class)
    public ResponseEntity<Object> handleDuplicate(ApiExceptions.DuplicateRequestException ex) {
        return body(HttpStatus.CONFLICT, "DUPLICATE_REQUEST", ex.getMessage());
    }

    @ExceptionHandler(ApiExceptions.ReservationExpiredException.class)
    public ResponseEntity<Object> handleExpired(ApiExceptions.ReservationExpiredException ex) {
        return body(HttpStatus.GONE, "RESERVATION_EXPIRED", ex.getMessage());
    }

    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<Object> handleOptimisticLock(ObjectOptimisticLockingFailureException ex) {
        return body(HttpStatus.CONFLICT, "CONCURRENT_MODIFICATION",
                "This record was updated by another request at the same time. Please retry.");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Object> handleBadArgument(IllegalArgumentException ex) {
        return body(HttpStatus.BAD_REQUEST, "BAD_REQUEST", ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleGeneric(Exception ex) {
        return body(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", ex.getMessage());
    }
}
