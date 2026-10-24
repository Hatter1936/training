package com.hackathon.training;

import com.hackathon.training.domain.model.Category;
import com.hackathon.training.domain.model.User;
import com.hackathon.training.persience.repository.CategoryRepository;
import com.hackathon.training.persience.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {
    private final UserRepository userRepo;
    private final CategoryRepository categoryRepo;

    public DataInitializer(UserRepository userRepo, CategoryRepository categoryRepo) {
        this.userRepo = userRepo;
        this.categoryRepo = categoryRepo;
    }

    @Override
    public void run(String... args) {
        if (userRepo.findByEmail("test@mail.ru") == null) {
            User u = new User();
            u.setEmail("test@mail.ru");
            u.setPassword("12345");
            u.setCompanyName("ООО Ромашка");
            u.setCompanyCode("C001");
            userRepo.save(u);
            System.out.println("Тестовый пользователь создан!");
        }

        if (categoryRepo.count() == 0) {
            Category c1 = new Category(); c1.setName("Зарплата"); c1.setType("EXPENSE"); c1.setIsRegular(true); categoryRepo.save(c1);
            Category c2 = new Category(); c2.setName("Аренда"); c2.setType("EXPENSE"); c2.setIsRegular(true); categoryRepo.save(c2);
            Category c3 = new Category(); c3.setName("Налоги"); c3.setType("EXPENSE"); c3.setIsRegular(true); categoryRepo.save(c3);
            Category c4 = new Category(); c4.setName("Выручка"); c4.setType("INCOME"); c4.setIsRegular(false); categoryRepo.save(c4);
            System.out.println("Категории созданы!");
        }
    }
}