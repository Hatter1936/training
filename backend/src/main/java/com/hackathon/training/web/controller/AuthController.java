package com.hackathon.training.web.controller;

import com.hackathon.training.domain.model.User;
import com.hackathon.training.domain.service.PasswordService;
import com.hackathon.training.persience.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepo;
    private final PasswordService passwordService;

    public AuthController(UserRepository userRepo, PasswordService passwordService) {
        this.userRepo = userRepo;
        this.passwordService = passwordService;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> req) {
        User user = userRepo.findByEmail(req.get("email"));
        if (user == null || !passwordService.matches(req.get("password"), user.getPassword())) {
            Map<String, Object> err = new HashMap<>();
            err.put("code", "AUTH_FAILED");
            err.put("message", "Неверный email или пароль");
            err.put("timestamp", java.time.LocalDateTime.now().toString());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
        }
        Map<String, Object> ok = new HashMap<>();
        ok.put("id", user.getId());
        ok.put("email", user.getEmail());
        ok.put("companyName", user.getCompanyName());
        return ResponseEntity.ok(ok);
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, String> req) {
        Map<String, Object> err = new HashMap<>();
        String email = req.get("email");
        String password = req.get("password");
        String companyName = req.get("companyName");

        if (email == null || !email.contains("@")) {
            err.put("code", "VALIDATION_FAILED");
            err.put("message", "Некорректный email");
            err.put("timestamp", java.time.LocalDateTime.now().toString());
            return ResponseEntity.badRequest().body(err);
        }
        if (password == null || password.length() < 5) {
            err.put("code", "VALIDATION_FAILED");
            err.put("message", "Пароль должен быть не менее 5 символов");
            err.put("timestamp", java.time.LocalDateTime.now().toString());
            return ResponseEntity.badRequest().body(err);
        }
        if (userRepo.findByEmail(email) != null) {
            err.put("code", "EMAIL_BUSY");
            err.put("message", "Пользователь с таким email уже существует");
            err.put("timestamp", java.time.LocalDateTime.now().toString());
            return ResponseEntity.badRequest().body(err);
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordService.hash(password));
        user.setCompanyName(companyName != null ? companyName : "");
        user.setCompanyCode("NEW_" + System.currentTimeMillis());
        userRepo.save(user);

        Map<String, Object> ok = new HashMap<>();
        ok.put("id", user.getId());
        ok.put("email", user.getEmail());
        ok.put("companyName", user.getCompanyName());
        return ResponseEntity.status(HttpStatus.CREATED).body(ok);
    }

    @PostMapping("/demo")
    public ResponseEntity<Map<String, Object>> demo() {
        User user = userRepo.findByEmail("demo@alpaka.ru");
        if (user == null) {
            user = new User();
            user.setEmail("demo@alpaka.ru");
            user.setPassword(passwordService.hash("demo123"));
            user.setCompanyName("ООО Демо");
            user.setCompanyCode("DEMO");
            userRepo.save(user);
        }
        Map<String, Object> ok = new HashMap<>();
        ok.put("id", user.getId());
        ok.put("email", user.getEmail());
        ok.put("companyName", user.getCompanyName());
        return ResponseEntity.ok(ok);
    }
}