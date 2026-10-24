package com.hackathon.training.persience.repository;

import com.hackathon.training.domain.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByUserId(Long userId);

    List<Event> findByUserIdAndIsPaidFalse(Long userId);
}
