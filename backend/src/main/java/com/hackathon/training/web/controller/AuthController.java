package com.hackathon.training.web.controller;

import com.hackathon.training.domain.model.User;
import com.hackathon.training.persience.repository.UserRepository;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserRepository userRepo;

    public AuthController(UserRepository userRepo) { this.userRepo = userRepo; }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> req) {
        User user = userRepo.findByEmail(req.get("email"));
        if (user == null || !user.getPassword().equals(req.get("password"))) {
            throw new RuntimeException("Неверный email или пароль");
        }
        return Map.of("id", user.getId(), "email", user.getEmail(), "companyName", user.getCompanyName());
    }

    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody Map<String, String> req) {
        if (userRepo.findByEmail(req.get("email")) != null) {
            throw new RuntimeException("Пользователь с таким email уже существует");
        }

        User user = new User();
        user.setEmail(req.get("email"));
        user.setPassword(req.get("password"));
        user.setCompanyName(req.get("companyName"));
        user.setCompanyCode("NEW_" + System.currentTimeMillis());

        userRepo.save(user);

        return Map.of("id", user.getId(), "email", user.getEmail(), "companyName", user.getCompanyName());
    }
}