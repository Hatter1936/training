package com.hackathon.training;

import com.hackathon.training.domain.model.Category;
import com.hackathon.training.domain.service.CategoryMatcherService;
import com.hackathon.training.persience.repository.CategoryRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final CategoryRepository categoryRepo;
    private final CategoryMatcherService matcher;

    public DataInitializer(CategoryRepository categoryRepo, CategoryMatcherService matcher) {
        this.categoryRepo = categoryRepo;
        this.matcher = matcher;
    }

    @Override
    public void run(String... args) {
        upsert("Зарплата", "EXPENSE", true);
        upsert("Аренда", "EXPENSE", true);
        upsert("Налоги", "EXPENSE", true);
        upsert("Выручка", "INCOME", false);
        upsert("Закупки", "EXPENSE", false);
        upsert("Банковские услуги", "EXPENSE", false);
        upsert("Прочее", "EXPENSE", false);

        matcher.refreshCache();
    }

    private void upsert(String name, String type, boolean regular) {
        Category c = categoryRepo.findByNameIgnoreCase(name);
        if (c == null) {
            c = new Category();
            c.setName(name);
        }
        c.setType(type);
        c.setIsRegular(regular);
        categoryRepo.save(c);
    }
}