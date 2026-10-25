package com.hackathon.training.web.controller;

import com.hackathon.training.domain.service.ForecastService;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/forecast")
public class ForecastController {

    private final ForecastService forecastService;

    public ForecastController(ForecastService forecastService) {
        this.forecastService = forecastService;
    }

    @GetMapping
    public Map<String, Object> getForecast(@RequestParam Long userId) {
        return forecastService.getForecast(userId);
    }

    @GetMapping("/scenario")
    public Map<String, Object> scenario(
            @RequestParam Long userId,
            @RequestParam String type,
            @RequestParam(required = false) BigDecimal percent) {
        return forecastService.scenario(userId, type, percent != null ? percent : BigDecimal.TEN);
    }
}