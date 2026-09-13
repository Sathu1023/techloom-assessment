package com.techloom.pos.config;

import com.techloom.pos.entity.Product;
import com.techloom.pos.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final ProductRepository productRepository;

    @Override
    public void run(String... args) {
        if (productRepository.count() > 0) {
            return;
        }

        productRepository.saveAll(List.of(
                book("Atomic Habits", "Tiny changes, remarkable results — a practical guide to building better habits.", "16.99", 12),
                book("Clean Code", "A handbook of agile software craftsmanship for writing readable, maintainable code.", "32.50", 8),
                book("The Pragmatic Programmer", "Timeless tips for becoming a more effective and adaptable software engineer.", "44.00", 6),
                book("Educated", "A memoir of family, education, and the power of reinventing yourself.", "14.99", 10),
                book("The Midnight Library", "A novel about the lives we could have lived and the choices that define us.", "13.50", 15),
                book("Designing Data-Intensive Applications", "The deep guide to reliable, scalable, and maintainable data systems.", "49.99", 5)
        ));
    }

    private static Product book(String name, String description, String price, int stock) {
        Product p = new Product();
        p.setName(name);
        p.setDescription(description);
        p.setPrice(new BigDecimal(price));
        p.setTotalStock(stock);
        p.setReservedStock(0);
        return p;
    }
}
