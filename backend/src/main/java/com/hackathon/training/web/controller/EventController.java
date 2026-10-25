package com.hackathon.training.web.controller;

import com.hackathon.training.domain.model.Event;
import com.hackathon.training.domain.model.User;
import com.hackathon.training.persience.repository.EventRepository;
import com.hackathon.training.persience.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventRepository eventRepo;
    private final UserRepository userRepo;

    public EventController(EventRepository eventRepo, UserRepository userRepo) {
        this.eventRepo = eventRepo;
        this.userRepo = userRepo;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createEvent(@RequestBody Map<String, Object> body) {
        Map<String, Object> err = new LinkedHashMap<>();

        Long userId = body.get("userId") != null ? Long.valueOf(body.get("userId").toString()) : null;
        String name = (String) body.get("name");
        String type = (String) body.get("type");
        Object amountObj = body.get("amount");
        String eventDateStr = (String) body.get("eventDate");
        String period = body.getOrDefault("period", "ONCE").toString();

        if (userId == null) {
            err.put("code", "VALIDATION_FAILED");
            err.put("message", "userId обязателен");
            return ResponseEntity.badRequest().body(err);
        }
        if (amountObj == null) {
            err.put("code", "VALIDATION_FAILED");
            err.put("message", "amount обязателен");
            return ResponseEntity.badRequest().body(err);
        }
        BigDecimal amount = new BigDecimal(amountObj.toString());
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            err.put("code", "VALIDATION_FAILED");
            err.put("message", "Сумма должна быть положительной");
            return ResponseEntity.badRequest().body(err);
        }
        if (eventDateStr == null) {
            err.put("code", "VALIDATION_FAILED");
            err.put("message", "eventDate обязателен");
            return ResponseEntity.badRequest().body(err);
        }

        User user = userRepo.findById(userId).orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        Event event = new Event();
        event.setName(name);
        event.setType(type);
        event.setAmount(amount);
        event.setEventDate(LocalDate.parse(eventDateStr));
        event.setPeriod(period);
        event.setIsPaid(false);
        event.setUser(user);
        eventRepo.save(event);

        Map<String, Object> ok = new LinkedHashMap<>();
        ok.put("id", event.getId());
        ok.put("name", event.getName());
        ok.put("type", event.getType());
        ok.put("amount", event.getAmount());
        ok.put("eventDate", event.getEventDate().toString());
        ok.put("period", event.getPeriod());
        ok.put("isPaid", event.getIsPaid());
        return ResponseEntity.status(HttpStatus.CREATED).body(ok);
    }

    @GetMapping
    public List<Map<String, Object>> getEvents(@RequestParam Long userId) {
        List<Event> events = eventRepo.findByUserId(userId);
        List<Map<String, Object>> out = new ArrayList<>();
        for (Event e : events) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", e.getId());
            m.put("name", e.getName());
            m.put("type", e.getType());
            m.put("amount", e.getAmount());
            m.put("eventDate", e.getEventDate() != null ? e.getEventDate().toString() : null);
            m.put("period", e.getPeriod());
            m.put("isPaid", e.getIsPaid());
            out.add(m);
        }
        return out;
    }

    @PatchMapping("/{id}/pay")
    public Map<String, Object> payEvent(@PathVariable Long id) {
        Event event = eventRepo.findById(id).orElseThrow(() -> new RuntimeException("Событие не найдено"));
        event.setIsPaid(true);
        eventRepo.save(event);

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", event.getId());
        m.put("isPaid", event.getIsPaid());
        return m;
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id) {
        if (!eventRepo.existsById(id)) {
            throw new RuntimeException("Событие не найдено");
        }
        eventRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}