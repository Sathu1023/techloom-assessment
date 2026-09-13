package com.techloom.ecommerce.config;

import com.techloom.ecommerce.entity.Product;
import com.techloom.ecommerce.repository.ProductRepository;
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
                book("Atomic Habits", "Tiny changes, remarkable results — a practical guide to building better habits.", "16.99", "Non-Fiction", 12),
                book("Educated", "A memoir of family, education, and the power of reinventing yourself.", "14.99", "Non-Fiction", 10),
                book("Clean Code", "A handbook of agile software craftsmanship for writing readable, maintainable code.", "32.50", "Technology", 8),
                book("The Pragmatic Programmer", "Timeless tips for becoming a more effective and adaptable software engineer.", "44.00", "Technology", 6),
                book("Designing Data-Intensive Applications", "The deep guide to reliable, scalable, and maintainable data systems.", "49.99", "Technology", 5),
                book("The Midnight Library", "A novel about the lives we could have lived and the choices that define us.", "13.50", "Fiction", 15),
                book("Project Hail Mary", "A lone astronaut, an impossible mission, and an unexpected friendship in space.", "18.99", "Fiction", 9),
                book("Where the Wild Things Are", "A classic picture-book adventure of imagination, mischief, and coming home.", "9.99", "Children's", 20)
        ));
    }

    private static Product book(String name, String description, String price, String category, int stock) {
        Product p = new Product();
        p.setName(name);
        p.setDescription(description);
        p.setPrice(new BigDecimal(price));
        p.setCategory(category);
        p.setTotalStock(stock);
        p.setReservedStock(0);
        return p;
    }
}
