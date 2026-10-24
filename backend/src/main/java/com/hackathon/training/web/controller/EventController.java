package com.hackathon.training.web.controller;

import com.hackathon.training.domain.model.Event;
import com.hackathon.training.domain.model.User;
import com.hackathon.training.persience.repository.EventRepository;
import com.hackathon.training.persience.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

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
    public Event createEvent(@RequestParam Long userId, @RequestBody Map<String, String> body) {
        User user = userRepo.findById(userId).orElseThrow();
        Event event = new Event();
        event.setName(body.get("name"));
        event.setType(body.get("type"));
        event.setAmount(new BigDecimal(body.get("amount")));
        event.setEventDate(LocalDate.parse(body.get("eventDate")));
        event.setPeriod(body.getOrDefault("period", "ONCE"));
        event.setUser(user);
        return eventRepo.save(event);
    }

    @GetMapping
    public List<Event> getEvents(@RequestParam Long userId) {
        return eventRepo.findByUserId(userId);
    }

    @PatchMapping("/{id}/pay")
    public Event payEvent(@PathVariable Long id) {
        Event event = eventRepo.findById(id).orElseThrow();
        event.setIsPaid(true);
        return eventRepo.save(event);
    }

    @DeleteMapping("/{id}")
    public void deleteEvent(@PathVariable Long id) {
        eventRepo.deleteById(id);
    }
}