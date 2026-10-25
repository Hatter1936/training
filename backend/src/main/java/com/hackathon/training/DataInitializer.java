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
        if (categoryRepo.count() == 0) {
            save("Зарплата", "EXPENSE", true);
            save("Аренда", "EXPENSE", true);
            save("Налоги", "EXPENSE", true);
            save("Выручка", "INCOME", false);
            save("Закупки", "EXPENSE", false);
            save("Банковские услуги", "EXPENSE", false);
            save("Прочее", "EXPENSE", false);
        }
        matcher.refreshCache();
    }

    private void save(String name, String type, boolean regular) {
        Category c = new Category();
        c.setName(name);
        c.setType(type);
        c.setIsRegular(regular);
        categoryRepo.save(c);
    }
}