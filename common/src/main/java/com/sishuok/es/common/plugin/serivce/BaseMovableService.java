/**
 * Copyright (c) 2005-2012 https://github.com/zhangkaitao
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 */
package com.sishuok.es.common.plugin.serivce;

import com.google.common.collect.Maps;
import com.sishuok.es.common.entity.BaseEntity;
import com.sishuok.es.common.entity.search.builder.SearchableBuilder;
import com.sishuok.es.common.plugin.entity.Movable;
import com.sishuok.es.common.repository.BaseRepository;
import com.sishuok.es.common.service.BaseService;
import org.springframework.aop.framework.AopContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;
import java.io.Serializable;
import java.util.List;
import java.util.Map;

/**
 * <p>User: Zhang Kaitao
 * <p>Date: 13-2-22 下午2:34
 * <p>Version: 1.0
 */
public abstract class BaseMovableService<M extends BaseEntity & Movable, ID extends Serializable> extends BaseService<M, ID> {


    //权重的步长
    public final Integer stepLength;

    /**
     * 默认步长1000
     */
    protected <R extends BaseRepository<M, ID>> BaseMovableService() {
        this(1000);

    }

    protected BaseMovableService(Integer stepLength) {
        this.stepLength = stepLength;
    }

    @Override
    public M save(M m) {
        if(m.getWeight() == null) {
            m.setWeight(findNextWeight());
        }
        return super.save(m);
    }

    /**
     * 按照降序进行移动
     * 把{fromId}移动到{}toId}之后
     * 如 fromWeight 2000 toWeight 1000   则新的为 500
     * @param fromId
     * @param toId
     */
    @Transactional
    public void down(ID fromId, ID toId) {
        M from = findOne(fromId);
        M to = findOne(toId);
        if (from == null || to == null || from.equals(to)) {
            return;
        }
        Integer fromWeight = from.getWeight();
        Integer toWeight = to.getWeight();


        M nextTo = findNextByWeight(toWeight);

        //如果toId的下一个是fromId 则直接交换顺序即可
        if (from.equals(nextTo)) {
            from.setWeight(toWeight);
            to.setWeight(fromWeight);
            return;
        }

        int minWeight = Math.min(fromWeight, toWeight);
        int maxWeight = Math.max(fromWeight, toWeight);
        //作为一个优化，减少不连续的weight
        int count = countByBetween(minWeight, maxWeight).intValue();
        if(count > 0 && count < 20) {
            List<M> moves = findByBetweenAndAsc(minWeight, maxWeight);
            if(fromWeight < toWeight) {
                Integer swapInteger = moves.get(count - 2).getWeight();
                for (int i = count - 2; i >= 1; i--) {
                    //最后一个的weight = toWeight;
                    moves.get(i).setWeight(moves.get(i - 1).getWeight());
                }
                moves.get(0).setWeight(swapInteger);
            } else {
                for (int i = 0; i <= count - 2; i++) {
                    moves.get(i).setWeight(moves.get(i + 1).getWeight());
                }
                moves.get(count - 1).setWeight(minWeight);
            }
            return;
        }

        M preTo = findPreByWeight(toWeight);

        //计算新的权重
        int newWeight = 0;
        if (preTo == null) {
            newWeight = toWeight / 2;
        } else {
            newWeight = toWeight - (toWeight - preTo.getWeight()) / 2;

        }

        if(Math.abs(newWeight - toWeight) <= 1) {
            throw new IllegalStateException(String.format("up error, no enough weight :fromId:%d, toId:%d", fromId, toId));
        }
        from.setWeight(newWeight);

    }

    /**
     * 按照降序进行移动
     * 把{fromId}移动到toId之下
     * 如 fromWeight 1000 toWeight 2000  3000 则新的为 2500
     * @param fromId
     * @param toId
     */
    @Transactional
    public void up(ID fromId, ID toId) {
        M from = findOne(fromId);
        M to = findOne(toId);
        if (from == null || to == null || from.equals(to)) {
            return;
        }
        Integer fromWeight = from.getWeight();
        Integer toWeight = to.getWeight();


        M preTo = findPreByWeight(toWeight);
        //如果toId的下一个是fromId 则直接交换顺序即可
        if(from.equals(preTo)) {
            from.setWeight(toWeight);
            to.setWeight(fromWeight);
            return;
        }

        int minWeight = Math.min(fromWeight, toWeight);
        int maxWeight = Math.max(fromWeight, toWeight);
        //作为一个优化，减少不连续的weight
        int count = countByBetween(minWeight, maxWeight).intValue();
        if(count > 0 && count < 20) {
            List<M> moves = findByBetweenAndDesc(minWeight, maxWeight);
            //123/124
            //5000 4000 3000

            if (fromWeight > toWeight) {
                Integer swapInteger = moves.get(count - 2).getWeight();
                for (int i = count - 2; i >= 1; i--) {
                    //最后一个的weight = toWeight;
                    moves.get(i).setWeight(moves.get(i - 1).getWeight());
                }
                moves.get(0).setWeight(swapInteger);
            } else {
                for (int i = 0; i <= count - 2; i++) {
                    moves.get(i).setWeight(moves.get(i + 1).getWeight());
                }
                moves.get(count - 1).setWeight(maxWeight);
            }
            return;
        }

        //如果toId的下一个是fromId 则直接交换顺序即可
        if (from.equals(preTo)) {
            from.setWeight(toWeight);
            to.setWeight(fromWeight);
            return;
        }
        M nextTo = findNextByWeight(toWeight);

        //计算新的权重
        int newWeight = 0;
        if(nextTo == null) {
            newWeight = toWeight + stepLength;
        } else {
            newWeight = toWeight + (nextTo.getWeight() - toWeight)/2;
        }

        if(Math.abs(newWeight - toWeight) <= 1) {
            throw new IllegalStateException(String.format("down error, no enough weight :fromId:%d, toId:%d", fromId, toId));
        }
        from.setWeight(newWeight);
    }

    @Transactional
    public void reweight() {
        int batchSize = 100;
        Sort sort = new Sort(Sort.Direction.DESC, "weight");
        Pageable pageable = new PageRequest(0, batchSize, sort);
        Page<M> page = findAll(pageable);
        do {
            //doReweight需要requiresNew事务
            ((BaseMovableService) AopContext.currentProxy()).doReweight(page);

            if(page.isLastPage()) {
                break;
            }

            pageable = new PageRequest((pageable.getPageNumber() + 1) * batchSize, batchSize, sort);
            page = findAll(pageable);
        } while (true);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void doReweight(Page<M> page) {
        int totalElements = (int)page.getTotalElements();
        List<M> moves = page.getContent();

        int firstElement = page.getNumber() * page.getSize();

        for(int i = 0; i < moves.size(); i++) {
            M move = moves.get(i);
            move.setWeight((totalElements - firstElement - i) * stepLength);
            update(move);
        }

    }

    private Integer findNextWeight() {
        Page<M> page = baseRepository.findAll(new Specification<M>() {
            @Override
            public Predicate toPredicate(Root<M> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
                query.orderBy(cb.desc(root.get("weight")));
                return query.getRestriction();
            }
        }, new PageRequest(0, 1));

        if(!page.hasContent()) {
            return stepLength;
        }

        return page.getContent().get(0).getWeight() + stepLength;
    }



    public M findPreByWeight(Integer weight) {

        Pageable pageable = new PageRequest(0, 1);
        Map<String, Object> searchParams = Maps.newHashMap();
        searchParams.put("weight_lt", weight);
        Sort sort = new Sort(Sort.Direction.DESC, "weight");
        Page<M> page = findAll(SearchableBuilder.newInstance(searchParams).setSort(sort).setPage(pageable).buildSearchable());

        if(page.hasContent()) {
            return page.getContent().get(0);
        }
        return null;
    }

    public M findNextByWeight(Integer weight) {
        Pageable pageable = new PageRequest(0, 1);

        Map<String, Object> searchParams = Maps.newHashMap();
        searchParams.put("weight_gt", weight);
        Sort sort = new Sort(Sort.Direction.ASC, "weight");
        Page<M> page = findAll(SearchableBuilder.newInstance(searchParams).setSort(sort).setPage(pageable).buildSearchable());

        if (page.hasContent()) {
            return page.getContent().get(0);
        }
        return null;
    }

    //@Query(value = "select count(m) from Move m where m.weight>=?1 and m.weight <= ?2")
    private Long countByBetween(Integer minWeight, Integer maxWeight) {
        Map<String, Object> searchParams = Maps.newHashMap();
        searchParams.put("weight_gte", minWeight);
        searchParams.put("weight_lte", maxWeight);
        return count(SearchableBuilder.newInstance(searchParams).buildSearchable());
    }

    //@Query(value = "from Move m where m.weight>=?1 and m.weight <= ?2 order by m.weight asc")
    List<M> findByBetweenAndAsc(Integer minWeight, Integer maxWeight) {
        Map<String, Object> searchParams = Maps.newHashMap();
        searchParams.put("weight_gte", minWeight);
        searchParams.put("weight_lte", maxWeight);

        Sort sort = new Sort(Sort.Direction.ASC, "weight");
        return findAllBySort(SearchableBuilder.newInstance(searchParams).setSort(sort).buildSearchable());
    }


    //@Query(value = "from Move m where m.weight>=?1 and m.weight <= ?2 order by m.weight desc")
    List<M> findByBetweenAndDesc(Integer minWeight, Integer maxWeight) {
        Map<String, Object> searchParams = Maps.newHashMap();
        searchParams.put("weight_gte", minWeight);
        searchParams.put("weight_lte", maxWeight);

        Sort sort = new Sort(Sort.Direction.DESC, "weight");
        return findAllBySort(SearchableBuilder.newInstance(searchParams).setSort(sort).buildSearchable());
    }


}
