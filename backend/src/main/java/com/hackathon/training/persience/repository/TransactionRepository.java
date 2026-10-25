package com.hackathon.training.persience.repository;

import com.hackathon.training.domain.model.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findByUserIdOrderByOperationDateDesc(Long userId);

    Page<Transaction> findByUserId(Long userId, Pageable pageable);

    List<Transaction> findByUserIdAndOperationDateAfter(Long userId, LocalDate date);

    Optional<Transaction> findFirstByUserIdOrderByOperationDateDesc(Long userId);

    @Query("SELECT t FROM Transaction t WHERE t.user.id = :userId ORDER BY t.operationDate DESC")
    Page<Transaction> findByUserOnly(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT t FROM Transaction t WHERE t.user.id = :userId AND t.operationDate >= :dateFrom ORDER BY t.operationDate DESC")
    Page<Transaction> findByUserAndDate(@Param("userId") Long userId, @Param("dateFrom") LocalDate dateFrom, Pageable pageable);

    @Query("SELECT t FROM Transaction t WHERE t.user.id = :userId AND t.category.id = :categoryId ORDER BY t.operationDate DESC")
    Page<Transaction> findByUserAndCategory(@Param("userId") Long userId, @Param("categoryId") Long categoryId, Pageable pageable);

    @Query("SELECT t FROM Transaction t WHERE t.user.id = :userId AND t.operationDate >= :dateFrom AND t.category.id = :categoryId ORDER BY t.operationDate DESC")
    Page<Transaction> findByUserAndDateAndCategory(@Param("userId") Long userId, @Param("dateFrom") LocalDate dateFrom, @Param("categoryId") Long categoryId, Pageable pageable);

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.user.id = :userId")
    long countByUser(@Param("userId") Long userId);
}