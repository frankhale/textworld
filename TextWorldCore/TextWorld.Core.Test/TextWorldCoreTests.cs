using FluentAssertions;
using System;
using TextWorld.Core.Components;
using Xunit;

namespace TextWorld.Core.Test
{
    public class TextWorldCoreTests
    {
        [Fact]
        public void CanCreateEmptyEntity()
        {
            // Arrange
            // Act
            var entity = new Entity("test entity");
            // Assert
            entity.Id.Should().NotBe(Guid.Empty);
        }

        [Fact]
        public void CanCreateEntityWithComponent()
        {
            // Arrange
            var entity = new Entity("test entity");
            entity.AddComponent(new DescriptionComponent("test component", "This is a test description"));
            // Act            
            // Assert
            entity.Components.Should().HaveCount(1);
        }

        [Fact]
        public void CanGetComponentByType()
        {
            // Arrange
            var entity = new Entity("test entity");
            string componentName = "test description component";
            string description = "This is a test description";
            entity.AddComponent(new DescriptionComponent(componentName, description));
            // Act            
            var component = entity.GetFirstComponentByType<DescriptionComponent>();
            // Assert
            component.Name.Should().Be(componentName);
            component.Description.Should().Be(description);
        }
    }
}
