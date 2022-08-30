import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';

const EventSuggestions = () => {
  return (
    <Card style={{ width: '18rem' }}>
      <Card.Header>Recent popular events</Card.Header>
      <ListGroup variant="flush">
        <ListGroup.Item>Pictionary</ListGroup.Item>
        <ListGroup.Item>Google Feud</ListGroup.Item>
        <ListGroup.Item>Escape Room</ListGroup.Item>
      </ListGroup>
    </Card>
  );
}

export default EventSuggestions;

