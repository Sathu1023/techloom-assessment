package com.techloom.pos.service;

import com.techloom.pos.dto.ProductDtos.ProductRequest;
import com.techloom.pos.dto.ProductDtos.ProductResponse;
import com.techloom.pos.entity.Product;
import com.techloom.pos.exception.ApiExceptions.InsufficientStockException;
import com.techloom.pos.exception.ApiExceptions.NotFoundException;
import com.techloom.pos.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<ProductResponse> listAll() {
        return productRepository.findAll().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public ProductResponse get(Long id) {
        return toDto(findOrThrow(id));
    }

    @Transactional
    public ProductResponse create(ProductRequest req) {
        Product p = new Product();
        p.setName(req.name());
        p.setDescription(req.description());
        p.setPrice(req.price());
        p.setTotalStock(req.totalStock());
        p.setReservedStock(0);
        return toDto(productRepository.save(p));
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest req) {
        // Use the locking read here too: an admin editing stock concurrently with
        // live reservations should not silently clobber reservedStock accounting.
        Product p = productRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new NotFoundException("Product not found: " + id));
        p.setName(req.name());
        p.setDescription(req.description());
        p.setPrice(req.price());
        // Never allow totalStock to be set below what's already reserved.
        if (req.totalStock() < p.getReservedStock()) {
            throw new InsufficientStockException(
                    "Cannot set stock below currently reserved quantity (" + p.getReservedStock() + ")");
        }
        p.setTotalStock(req.totalStock());
        return toDto(p);
    }

    @Transactional
    public void delete(Long id) {
        if (!productRepository.existsById(id)) {
            throw new NotFoundException("Product not found: " + id);
        }
        productRepository.deleteById(id);
    }

    Product findOrThrow(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Product not found: " + id));
    }

    ProductResponse toDto(Product p) {
        return new ProductDtosMapper(p).toResponse();
    }

    /** Small inline mapper kept private to this class for clarity. */
    private record ProductDtosMapper(Product p) {
        ProductResponse toResponse() {
            return new ProductResponse(
                    p.getId(), p.getName(), p.getDescription(), p.getPrice(),
                    p.getTotalStock(), p.getReservedStock(), p.getAvailableStock());
        }
    }
}
