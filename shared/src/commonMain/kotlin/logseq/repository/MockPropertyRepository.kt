package logseq.repository

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.flowOf
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant

/**
 * Mock implementation of PropertyRepository for testing
 */
class MockPropertyRepository : PropertyRepository {

    private val properties = mutableMapOf<String, Property>()
    private val propertiesFlow = MutableStateFlow<List<Property>>(emptyList())

    override suspend fun findById(id: String): Property? = properties[id]

    override suspend fun findAll(): List<Property> = properties.values.toList()

    override suspend fun findAllPaginated(pagination: Pagination): Page<Property> {
        val allProperties = properties.values.toList()
        val startIndex = pagination.offset
        val endIndex = (startIndex + pagination.limit).coerceAtMost(allProperties.size)
        val items = if (startIndex < allProperties.size) allProperties.subList(startIndex, endIndex) else emptyList()
        return Page(items, allProperties.size, endIndex < allProperties.size)
    }

    override suspend fun save(entity: Property): Property {
        val now = Clock.System.now()
        val savedProperty = entity.copy(updatedAt = now)
        properties[entity.id] = savedProperty
        updateFlow()
        return savedProperty
    }

    override suspend fun saveAll(entities: List<Property>): List<Property> {
        val now = Clock.System.now()
        val savedProperties = entities.map { it.copy(updatedAt = now) }
        savedProperties.forEach { properties[it.id] = it }
        updateFlow()
        return savedProperties
    }

    override suspend fun deleteById(id: String): Boolean {
        val removed = properties.remove(id) != null
        if (removed) updateFlow()
        return removed
    }

    override suspend fun delete(entity: Property): Boolean = deleteById(entity.id)

    override suspend fun existsById(id: String): Boolean = properties.containsKey(id)

    override suspend fun count(): Long = properties.size.toLong()

    override suspend fun findByEntityId(entityId: String, entityType: EntityType): List<Property> =
        properties.values.filter { it.entityId == entityId && it.entityType == entityType }

    override suspend fun findByEntityIds(entityIds: List<String>, entityType: EntityType): Map<String, List<Property>> =
        entityIds.associateWith { entityId ->
            properties.values.filter { it.entityId == entityId && it.entityType == entityType }
        }

    override suspend fun findByKeyAndEntityType(key: String, entityType: EntityType, pagination: Pagination): Page<Property> {
        val filteredProperties = properties.values.filter { it.key == key && it.entityType == entityType }
        val startIndex = pagination.offset
        val endIndex = (startIndex + pagination.limit).coerceAtMost(filteredProperties.size)
        val items = if (startIndex < filteredProperties.size) filteredProperties.subList(startIndex, endIndex) else emptyList()
        return Page(items, filteredProperties.size, endIndex < filteredProperties.size)
    }

    override suspend fun findByKey(key: String, pagination: Pagination): Page<Property> {
        val filteredProperties = properties.values.filter { it.key == key }
        val startIndex = pagination.offset
        val endIndex = (startIndex + pagination.limit).coerceAtMost(filteredProperties.size)
        val items = if (startIndex < filteredProperties.size) filteredProperties.subList(startIndex, endIndex) else emptyList()
        return Page(items, filteredProperties.size, endIndex < filteredProperties.size)
    }

    override suspend fun findDistinctKeys(entityType: EntityType?): List<String> {
        val filteredProperties = if (entityType != null) {
            properties.values.filter { it.entityType == entityType }
        } else {
            properties.values
        }
        return filteredProperties.map { it.key }.distinct()
    }

    override suspend fun countByKey(key: String): Long =
        properties.values.count { it.key == key }.toLong()

    override suspend fun findByValue(value: Any, pagination: Pagination): Page<Property> {
        val filteredProperties = properties.values.filter { it.value == value }
        val startIndex = pagination.offset
        val endIndex = (startIndex + pagination.limit).coerceAtMost(filteredProperties.size)
        val items = if (startIndex < filteredProperties.size) filteredProperties.subList(startIndex, endIndex) else emptyList()
        return Page(items, filteredProperties.size, endIndex < filteredProperties.size)
    }

    override suspend fun findByValuePattern(pattern: String, pagination: Pagination): Page<Property> {
        val filteredProperties = properties.values.filter { it.value.toString().contains(pattern) }
        val startIndex = pagination.offset
        val endIndex = (startIndex + pagination.limit).coerceAtMost(filteredProperties.size)
        val items = if (startIndex < filteredProperties.size) filteredProperties.subList(startIndex, endIndex) else emptyList()
        return Page(items, filteredProperties.size, endIndex < filteredProperties.size)
    }

    override suspend fun search(criteria: PropertySearchCriteria, pagination: Pagination): Page<Property> {
        var filteredProperties = properties.values.asSequence()

        criteria.key?.let { key ->
            filteredProperties = filteredProperties.filter { it.key == key }
        }

        criteria.value?.let { value ->
            filteredProperties = filteredProperties.filter { it.value == value }
        }

        criteria.entityId?.let { entityId ->
            filteredProperties = filteredProperties.filter { it.entityId == entityId }
        }

        criteria.entityType?.let { entityType ->
            filteredProperties = filteredProperties.filter { it.entityType == entityType }
        }

        criteria.keys?.let { keys ->
            filteredProperties = filteredProperties.filter { it.key in keys }
        }

        val result = filteredProperties.toList()
        val startIndex = pagination.offset
        val endIndex = (startIndex + pagination.limit).coerceAtMost(result.size)
        val items = if (startIndex < result.size) result.subList(startIndex, endIndex) else emptyList()
        return Page(items, result.size, endIndex < result.size)
    }

    override suspend fun savePropertiesForEntity(entityId: String, entityType: EntityType, properties: Map<String, Any>): List<Property> {
        val now = Clock.System.now()
        val propertyEntities = properties.map { (key, value) ->
            Property(
                id = generateId(),
                key = key,
                value = value,
                entityId = entityId,
                entityType = entityType,
                createdAt = now,
                updatedAt = now
            )
        }
        propertyEntities.forEach { this.properties[it.id] = it }
        updateFlow()
        return propertyEntities
    }

    override suspend fun updatePropertiesForEntity(entityId: String, entityType: EntityType, properties: Map<String, Any>): List<Property> {
        // First delete existing properties for this entity
        val existingProperties = findByEntityId(entityId, entityType)
        existingProperties.forEach { deleteById(it.id) }

        // Then save new properties
        return savePropertiesForEntity(entityId, entityType, properties)
    }

    override suspend fun deletePropertiesForEntity(entityId: String, entityType: EntityType): Boolean {
        val propertiesToDelete = findByEntityId(entityId, entityType)
        var deleted = false
        propertiesToDelete.forEach {
            if (deleteById(it.id)) deleted = true
        }
        return deleted
    }

    override suspend fun deleteByKeyAndEntityId(key: String, entityId: String, entityType: EntityType): Boolean {
        val propertyToDelete = properties.values.find {
            it.key == key && it.entityId == entityId && it.entityType == entityType
        }
        return propertyToDelete?.let { deleteById(it.id) } ?: false
    }

    override suspend fun getPropertyValue(entityId: String, entityType: EntityType, key: String): Any? =
        properties.values.find { it.key == key && it.entityId == entityId && it.entityType == entityType }?.value

    override suspend fun setPropertyValue(entityId: String, entityType: EntityType, key: String, value: Any): Property {
        val existingProperty = properties.values.find {
            it.key == key && it.entityId == entityId && it.entityType == entityType
        }

        val now = Clock.System.now()
        val property = if (existingProperty != null) {
            existingProperty.copy(value = value, updatedAt = now)
        } else {
            Property(
                id = generateId(),
                key = key,
                value = value,
                entityId = entityId,
                entityType = entityType,
                createdAt = now,
                updatedAt = now
            )
        }

        properties[property.id] = property
        updateFlow()
        return property
    }

    override suspend fun incrementNumericProperty(entityId: String, entityType: EntityType, key: String, increment: Number): Property? {
        val existingProperty = properties.values.find {
            it.key == key && it.entityId == entityId && it.entityType == entityType
        }

        return existingProperty?.let { property ->
            val currentValue = property.value
            if (currentValue is Number) {
                val newValue = currentValue.toDouble() + increment.toDouble()
                setPropertyValue(entityId, entityType, key, newValue)
            } else {
                null
            }
        }
    }

    override suspend fun findPropertiesWithType(type: PropertyValueType, pagination: Pagination): Page<Property> {
        val filteredProperties = properties.values.filter { getValueType(it.value) == type }
        val startIndex = pagination.offset
        val endIndex = (startIndex + pagination.limit).coerceAtMost(filteredProperties.size)
        val items = if (startIndex < filteredProperties.size) filteredProperties.subList(startIndex, endIndex) else emptyList()
        return Page(items, filteredProperties.size, endIndex < filteredProperties.size)
    }

    override suspend fun findDateProperties(pagination: Pagination): Page<Property> =
        findPropertiesWithType(PropertyValueType.DATE, pagination)

    override suspend fun findNumericProperties(pagination: Pagination): Page<Property> =
        findPropertiesWithType(PropertyValueType.NUMBER, pagination)

    override suspend fun findBooleanProperties(pagination: Pagination): Page<Property> =
        findPropertiesWithType(PropertyValueType.BOOLEAN, pagination)

    override suspend fun findArrayProperties(pagination: Pagination): Page<Property> =
        findPropertiesWithType(PropertyValueType.ARRAY, pagination)

    override suspend fun findObjectProperties(pagination: Pagination): Page<Property> =
        findPropertiesWithType(PropertyValueType.OBJECT, pagination)

    override fun observePropertiesForEntity(entityId: String, entityType: EntityType): Flow<List<Property>> =
        flowOf(properties.values.filter { it.entityId == entityId && it.entityType == entityType })

    override fun observeProperty(entityId: String, entityType: EntityType, key: String): Flow<Property?> =
        flowOf(properties.values.find { it.key == key && it.entityId == entityId && it.entityType == entityType })

    override fun observePropertiesByKey(key: String): Flow<List<Property>> =
        flowOf(properties.values.filter { it.key == key })

    override suspend fun validatePropertyValue(key: String, value: Any): Boolean = true

    override suspend fun getAllowedValuesForProperty(key: String): List<Any>? = null

    override suspend fun getPropertySchema(key: String): PropertySchema? = null

    override suspend fun updatePropertySchema(key: String, schema: PropertySchema): PropertySchema = schema

    private fun getValueType(value: Any): PropertyValueType = when (value) {
        is String -> PropertyValueType.STRING
        is Number -> PropertyValueType.NUMBER
        is Boolean -> PropertyValueType.BOOLEAN
        is List<*> -> PropertyValueType.ARRAY
        is Map<*, *> -> PropertyValueType.OBJECT
        else -> PropertyValueType.OBJECT
    }

    private fun generateId(): String = "prop_${properties.size + 1}"

    private fun updateFlow() {
        propertiesFlow.value = properties.values.toList()
    }
}